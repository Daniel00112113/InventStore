import express from 'express';
import db from '../config/db.js';
import { authenticate, validateTenant } from '../middleware/auth.js';

const router = express.Router();

// --- Clientes ---

router.get('/', authenticate, validateTenant, (req, res) => {
    const customers = db.prepare(`
        SELECT * FROM customers WHERE store_id = ? ORDER BY name
    `).all(req.storeId);
    res.json(customers);
});

router.get('/with-debt', authenticate, validateTenant, (req, res) => {
    const customers = db.prepare(`
        SELECT * FROM customers WHERE store_id = ? AND balance > 0 ORDER BY balance DESC
    `).all(req.storeId);
    res.json(customers);
});

router.post('/', authenticate, validateTenant, (req, res) => {
    const { name, phone, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre requerido' });

    const result = db.prepare(`
        INSERT INTO customers (store_id, name, phone, address) VALUES (?, ?, ?, ?)
    `).run(req.storeId, name, phone || null, address || null);
    res.status(201).json({ id: result.lastInsertRowid });
});

// --- Facturas (sales) como sub-recurso ---

const salesRouter = express.Router({ mergeParams: true });

salesRouter.post('/', authenticate, validateTenant, (req, res) => {
    const { customerId, items, paymentType, cashAmount, creditAmount } = req.body;

    if (!items || items.length === 0) return res.status(400).json({ error: 'Debe incluir productos' });
    if (!['efectivo', 'fiado', 'mixto'].includes(paymentType)) return res.status(400).json({ error: 'Tipo de pago inválido' });
    if ((paymentType === 'fiado' || paymentType === 'mixto') && !customerId) return res.status(400).json({ error: 'Cliente requerido para venta fiada o mixta' });

    const transaction = db.transaction(() => {
        let total = 0;
        for (const item of items) {
            const product = db.prepare('SELECT * FROM products WHERE id = ? AND store_id = ?').get(item.productId, req.storeId);
            if (!product) throw new Error(`Producto ${item.productId} no encontrado`);
            if (product.stock < item.quantity) throw new Error(`Stock insuficiente para ${product.name}`);
            total += product.sale_price * item.quantity;
        }

        let finalCashAmount = 0, finalCreditAmount = 0;
        if (paymentType === 'efectivo') finalCashAmount = total;
        else if (paymentType === 'fiado') finalCreditAmount = total;
        else if (paymentType === 'mixto') { finalCashAmount = cashAmount || 0; finalCreditAmount = creditAmount || 0; }

        const saleResult = db.prepare(`
            INSERT INTO sales (store_id, user_id, customer_id, subtotal, discount, total, payment_type, cash_amount, credit_amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(req.storeId, req.user.userId, customerId || null, total, 0, total, paymentType, finalCashAmount, finalCreditAmount);
        const saleId = saleResult.lastInsertRowid;

        const itemStmt = db.prepare(`
            INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)
        `);
        const stockStmt = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
        for (const item of items) {
            const product = db.prepare('SELECT sale_price FROM products WHERE id = ?').get(item.productId);
            const subtotal = product.sale_price * item.quantity;
            itemStmt.run(saleId, item.productId, item.quantity, product.sale_price, subtotal);
            stockStmt.run(item.quantity, item.productId);
        }

        if (finalCreditAmount > 0 && customerId) {
            db.prepare('UPDATE customers SET balance = balance + ? WHERE id = ?').run(finalCreditAmount, customerId);
        }
        return { saleId, total };
    });

    try {
        res.status(201).json(transaction());
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

salesRouter.get('/', authenticate, validateTenant, (req, res) => {
    const { startDate, endDate, customerId } = req.query;
    let query = 'SELECT s.*, u.full_name as user_name, c.name as customer_name FROM sales s JOIN users u ON s.user_id = u.id LEFT JOIN customers c ON s.customer_id = c.id WHERE s.store_id = ?';
    const params = [req.storeId];
    if (startDate) { query += ' AND DATE(s.created_at) >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND DATE(s.created_at) <= ?'; params.push(endDate); }
    if (customerId) { query += ' AND s.customer_id = ?'; params.push(customerId); }
    query += ' ORDER BY s.created_at DESC LIMIT 100';
    const sales = db.prepare(query).all(...params);
    res.json(sales);
});

salesRouter.get('/:id', authenticate, validateTenant, (req, res) => {
    const sale = db.prepare(`
        SELECT s.*, u.full_name as user_name, c.name as customer_name
        FROM sales s JOIN users u ON s.user_id = u.id LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.id = ? AND s.store_id = ?
    `).get(req.params.id, req.storeId);
    if (!sale) return res.status(404).json({ error: 'Venta no encontrada' });
    const items = db.prepare(`
        SELECT si.*, p.name as product_name FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?
    `).all(req.params.id);
    res.json({ ...sale, items });
});

router.use('/sales', salesRouter);

// --- Cliente por ID (después de /sales) ---

router.put('/:id', authenticate, validateTenant, (req, res) => {
    const { name, phone, address } = req.body;
    const result = db.prepare(`
        UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ? AND store_id = ?
    `).run(name, phone, address, req.params.id, req.storeId);
    if (result.changes === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ success: true });
});

router.post('/:id/payment', authenticate, validateTenant, (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Monto inválido' });

    const transaction = db.transaction(() => {
        const customer = db.prepare('SELECT balance FROM customers WHERE id = ? AND store_id = ?').get(req.params.id, req.storeId);
        if (!customer) throw new Error('Cliente no encontrado');
        if (amount > customer.balance) throw new Error('El monto excede la deuda');
        db.prepare('INSERT INTO payments (store_id, customer_id, amount) VALUES (?, ?, ?)').run(req.storeId, req.params.id, amount);
        db.prepare('UPDATE customers SET balance = balance - ? WHERE id = ?').run(amount, req.params.id);
        return { success: true };
    });
    try {
        res.json(transaction());
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/:id/payments', authenticate, validateTenant, (req, res) => {
    const payments = db.prepare(`
        SELECT * FROM payments WHERE customer_id = ? AND store_id = ? ORDER BY created_at DESC
    `).all(req.params.id, req.storeId);
    res.json(payments);
});

export default router;

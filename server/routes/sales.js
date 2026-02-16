import express from 'express';
import db from '../config/db.js';
import { authenticate, validateTenant } from '../middleware/auth.js';

const router = express.Router();

// Crear venta
router.post('/', authenticate, validateTenant, (req, res) => {
    const { customerId, items, paymentType, cashAmount, creditAmount } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Debe incluir productos' });
    }

    if (!['efectivo', 'fiado', 'mixto'].includes(paymentType)) {
        return res.status(400).json({ error: 'Tipo de pago inválido' });
    }

    if ((paymentType === 'fiado' || paymentType === 'mixto') && !customerId) {
        return res.status(400).json({ error: 'Cliente requerido para venta fiada o mixta' });
    }

    const transaction = db.transaction(() => {
        let total = 0;

        // Validar stock y calcular total
        for (const item of items) {
            const product = db.prepare('SELECT * FROM products WHERE id = ? AND store_id = ?')
                .get(item.productId, req.storeId);

            if (!product) {
                throw new Error(`Producto ${item.productId} no encontrado`);
            }

            if (product.stock < item.quantity) {
                throw new Error(`Stock insuficiente para ${product.name}`);
            }

            total += product.sale_price * item.quantity;
        }

        // Determinar montos según tipo de pago
        let finalCashAmount = 0;
        let finalCreditAmount = 0;

        if (paymentType === 'efectivo') {
            finalCashAmount = total;
        } else if (paymentType === 'fiado') {
            finalCreditAmount = total;
        } else if (paymentType === 'mixto') {
            finalCashAmount = cashAmount || 0;
            finalCreditAmount = creditAmount || 0;
        }

        // Crear venta
        const saleStmt = db.prepare(`
      INSERT INTO sales (store_id, user_id, customer_id, subtotal, discount, total, payment_type, cash_amount, credit_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        const saleResult = saleStmt.run(
            req.storeId,
            req.user.userId,
            customerId || null,
            total,
            0,
            total,
            paymentType,
            finalCashAmount,
            finalCreditAmount
        );

        const saleId = saleResult.lastInsertRowid;

        // Crear items y actualizar stock
        const itemStmt = db.prepare(`
      INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `);

        const stockStmt = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

        for (const item of items) {
            const product = db.prepare('SELECT sale_price FROM products WHERE id = ?')
                .get(item.productId);

            const subtotal = product.sale_price * item.quantity;
            itemStmt.run(saleId, item.productId, item.quantity, product.sale_price, subtotal);
            stockStmt.run(item.quantity, item.productId);
        }

        // Si hay monto a crédito, actualizar balance del cliente
        if (finalCreditAmount > 0 && customerId) {
            db.prepare('UPDATE customers SET balance = balance + ? WHERE id = ?')
                .run(finalCreditAmount, customerId);
        }

        return { saleId, total };
    });

    try {
        const result = transaction();
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Listar ventas
router.get('/', authenticate, validateTenant, (req, res) => {
    const { startDate, endDate } = req.query;

    let query = 'SELECT s.*, u.full_name as user_name, c.name as customer_name FROM sales s JOIN users u ON s.user_id = u.id LEFT JOIN customers c ON s.customer_id = c.id WHERE s.store_id = ?';
    const params = [req.storeId];

    if (startDate) {
        query += ' AND DATE(s.created_at) >= ?';
        params.push(startDate);
    }

    if (endDate) {
        query += ' AND DATE(s.created_at) <= ?';
        params.push(endDate);
    }

    query += ' ORDER BY s.created_at DESC LIMIT 100';

    const sales = db.prepare(query).all(...params);
    res.json(sales);
});

// Detalle de venta
router.get('/:id', authenticate, validateTenant, (req, res) => {
    const sale = db.prepare(`
    SELECT s.*, u.full_name as user_name, c.name as customer_name 
    FROM sales s 
    JOIN users u ON s.user_id = u.id 
    LEFT JOIN customers c ON s.customer_id = c.id 
    WHERE s.id = ? AND s.store_id = ?
  `).get(req.params.id, req.storeId);

    if (!sale) {
        return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const items = db.prepare(`
    SELECT si.*, p.name as product_name 
    FROM sale_items si 
    JOIN products p ON si.product_id = p.id 
    WHERE si.sale_id = ?
  `).all(req.params.id);

    res.json({ ...sale, items });
});

export default router;

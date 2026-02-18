import express from 'express';
import db from '../config/db.js';
import { authenticate, validateTenant } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// CUSTOMERS
// ==========================================

// Get all customers
router.get('/customers', authenticate, validateTenant, (req, res) => {
    try {
        const customers = db.prepare(`
            SELECT * FROM customers WHERE store_id = ? ORDER BY name
        `).all(req.storeId);
        res.json(customers);
    } catch (error) {
        console.error('Error getting customers:', error);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

// Get customers with debt
router.get('/customers/with-debt', authenticate, validateTenant, (req, res) => {
    try {
        const customers = db.prepare(`
            SELECT * FROM customers WHERE store_id = ? AND balance > 0 ORDER BY balance DESC
        `).all(req.storeId);
        res.json(customers);
    } catch (error) {
        console.error('Error getting customers with debt:', error);
        res.status(500).json({ error: 'Error al obtener deudores' });
    }
});

// Create customer
router.post('/customers', authenticate, validateTenant, (req, res) => {
    try {
        const { name, phone, address } = req.body;
        if (!name) return res.status(400).json({ error: 'Nombre requerido' });

        const result = db.prepare(`
            INSERT INTO customers (store_id, name, phone, address) VALUES (?, ?, ?, ?)
        `).run(req.storeId, name, phone || null, address || null);
        res.status(201).json({ id: result.lastInsertRowid });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Error al crear cliente' });
    }
});

// Update customer
router.put('/customers/:id', authenticate, validateTenant, (req, res) => {
    try {
        const { name, phone, address } = req.body;
        const result = db.prepare(`
            UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ? AND store_id = ?
        `).run(name, phone, address, req.params.id, req.storeId);
        if (result.changes === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
});

// Customer Make Payment (Pay Debt)
router.post('/customers/:id/payment', authenticate, validateTenant, (req, res) => {
    try {
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

        res.json(transaction());
    } catch (err) {
        console.error('Error processing payment:', err);
        res.status(400).json({ error: err.message });
    }
});

// Get Customer Payments History
router.get('/customers/:id/payments', authenticate, validateTenant, (req, res) => {
    try {
        const payments = db.prepare(`
            SELECT * FROM payments WHERE customer_id = ? AND store_id = ? ORDER BY created_at DESC
        `).all(req.params.id, req.storeId);
        res.json(payments);
    } catch (error) {
        console.error('Error getting payments:', error);
        res.status(500).json({ error: 'Error al obtener pagos' });
    }
});

// ==========================================
// SALES / INVOICES
// ==========================================

// Create New Sale
router.post('/sales', authenticate, validateTenant, (req, res) => {
    try {
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

        res.status(201).json(transaction());
    } catch (err) {
        console.error('Error creating sale:', err);
        res.status(400).json({ error: err.message });
    }
});

// List Sales (Invoices)
router.get('/sales', authenticate, validateTenant, (req, res) => {
    try {
        const { startDate, endDate, customerId, limit = 100 } = req.query;

        let query = `
            SELECT
                s.id,
                s.total,
                s.subtotal,
                s.discount,
                s.payment_type,
                s.cash_amount,
                s.credit_amount,
                s.status,
                s.created_at,
                u.full_name as user_name,
                u.full_name as cashier_name,
                c.name as customer_name,
                COUNT(si.id) as items_count
            FROM sales s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN sale_items si ON s.id = si.sale_id
            WHERE s.store_id = ?
        `;
        const params = [req.storeId];

        if (startDate) {
            query += ' AND DATE(s.created_at) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND DATE(s.created_at) <= ?';
            params.push(endDate);
        }
        if (customerId) {
            query += ' AND s.customer_id = ?';
            params.push(customerId);
        }

        query += ` GROUP BY s.id ORDER BY s.created_at DESC LIMIT ?`;
        params.push(parseInt(limit));

        const sales = db.prepare(query).all(...params);
        res.json(sales);
    } catch (error) {
        console.error('Error getting sales:', error);
        res.status(500).json({ error: 'Error al obtener ventas' });
    }
});

// Get Sale Detail
router.get('/sales/:id', authenticate, validateTenant, (req, res) => {
    try {
        const saleId = req.params.id;

        const sale = db.prepare(`
            SELECT
                s.*,
                u.full_name as user_name,
                u.full_name as cashier_name,
                c.name as customer_name,
                c.phone as customer_phone
            FROM sales s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.id = ? AND s.store_id = ?
        `).get(saleId, req.storeId);

        if (!sale) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        const items = db.prepare(`
            SELECT
                si.*,
                p.name as product_name,
                p.barcode
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
        `).all(saleId);

        res.json({ ...sale, items });
    } catch (error) {
        console.error('Error getting sale detail:', error);
        res.status(500).json({ error: 'Error al obtener detalle de venta' });
    }
});

// Cancel Invoice (Delete/Void)
router.delete('/sales/:id', authenticate, validateTenant, (req, res) => {
    try {
        const invoiceId = req.params.id;

        const sale = db.prepare(`
            SELECT * FROM sales WHERE id = ? AND store_id = ?
        `).get(invoiceId, req.storeId);

        if (!sale) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        const items = db.prepare(`
            SELECT product_id, quantity FROM sale_items WHERE sale_id = ?
        `).all(invoiceId);

        const transaction = db.transaction(() => {
            // Restore stock
            const updateStockStmt = db.prepare(`
                UPDATE products SET stock = stock + ? WHERE id = ?
            `);
            for (const item of items) {
                updateStockStmt.run(item.quantity, item.product_id);
            }

            // Restore customer balance if credit
            if (sale.credit_amount > 0 && sale.customer_id) {
                db.prepare(`
                    UPDATE customers SET balance = MAX(0, balance - ?) WHERE id = ?
                `).run(sale.credit_amount, sale.customer_id);
            }

            db.prepare('DELETE FROM sale_items WHERE sale_id = ?').run(invoiceId);
            db.prepare('DELETE FROM sales WHERE id = ?').run(invoiceId);
        });

        transaction();

        res.json({ message: 'Factura anulada exitosamente' });
    } catch (error) {
        console.error('Error canceling invoice:', error);
        res.status(500).json({ error: 'Error al anular factura' });
    }
});

export default router;

import express from 'express';
import db from '../config/db.js';
import { authenticate, validateTenant } from '../middleware/auth.js';

const router = express.Router();

// Listar clientes
router.get('/', authenticate, validateTenant, (req, res) => {
    const customers = db.prepare(`
    SELECT * FROM customers 
    WHERE store_id = ? 
    ORDER BY name
  `).all(req.storeId);

    res.json(customers);
});

// Clientes con deuda
router.get('/with-debt', authenticate, validateTenant, (req, res) => {
    const customers = db.prepare(`
    SELECT * FROM customers 
    WHERE store_id = ? AND balance > 0 
    ORDER BY balance DESC
  `).all(req.storeId);

    res.json(customers);
});

// Crear cliente
router.post('/', authenticate, validateTenant, (req, res) => {
    const { name, phone, address } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Nombre requerido' });
    }

    const stmt = db.prepare(`
    INSERT INTO customers (store_id, name, phone, address)
    VALUES (?, ?, ?, ?)
  `);

    const result = stmt.run(req.storeId, name, phone || null, address || null);

    res.status(201).json({ id: result.lastInsertRowid });
});

// Actualizar cliente
router.put('/:id', authenticate, validateTenant, (req, res) => {
    const { name, phone, address } = req.body;

    const stmt = db.prepare(`
    UPDATE customers 
    SET name = ?, phone = ?, address = ?
    WHERE id = ? AND store_id = ?
  `);

    const result = stmt.run(name, phone, address, req.params.id, req.storeId);

    if (result.changes === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ success: true });
});

// Registrar pago
router.post('/:id/payment', authenticate, validateTenant, (req, res) => {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Monto inválido' });
    }

    const transaction = db.transaction(() => {
        const customer = db.prepare('SELECT balance FROM customers WHERE id = ? AND store_id = ?')
            .get(req.params.id, req.storeId);

        if (!customer) {
            throw new Error('Cliente no encontrado');
        }

        if (amount > customer.balance) {
            throw new Error('El monto excede la deuda');
        }

        // Registrar pago
        db.prepare(`
      INSERT INTO payments (store_id, customer_id, amount)
      VALUES (?, ?, ?)
    `).run(req.storeId, req.params.id, amount);

        // Actualizar balance
        db.prepare('UPDATE customers SET balance = balance - ? WHERE id = ?')
            .run(amount, req.params.id);

        return { success: true };
    });

    try {
        const result = transaction();
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Historial de pagos
router.get('/:id/payments', authenticate, validateTenant, (req, res) => {
    const payments = db.prepare(`
    SELECT * FROM payments 
    WHERE customer_id = ? AND store_id = ?
    ORDER BY created_at DESC
  `).all(req.params.id, req.storeId);

    res.json(payments);
});

export default router;

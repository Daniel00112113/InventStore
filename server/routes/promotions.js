import express from 'express';
import db from '../config/db.js';
import { authenticate, validateTenant } from '../middleware/auth.js';

const router = express.Router();

// Listar promociones activas
router.get('/', authenticate, validateTenant, (req, res) => {
    try {
        const promotions = db.prepare(`
      SELECT * FROM promotions
      WHERE store_id = ? AND active = 1
      AND (start_date IS NULL OR start_date <= datetime('now'))
      AND (end_date IS NULL OR end_date >= datetime('now'))
      ORDER BY created_at DESC
    `).all(req.storeId);

        res.json(promotions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear promoción
router.post('/', authenticate, validateTenant, (req, res) => {
    const { name, type, value, minPurchase, startDate, endDate } = req.body;

    if (!name || !type || !value) {
        return res.status(400).json({ error: 'Datos incompletos' });
    }

    if (!['percentage', 'fixed'].includes(type)) {
        return res.status(400).json({ error: 'Tipo inválido' });
    }

    try {
        const stmt = db.prepare(`
      INSERT INTO promotions (store_id, name, type, value, min_purchase, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

        const result = stmt.run(
            req.storeId,
            name,
            type,
            value,
            minPurchase || 0,
            startDate || null,
            endDate || null
        );

        res.status(201).json({ id: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Calcular descuento aplicable
router.post('/calculate', authenticate, validateTenant, (req, res) => {
    const { subtotal, promotionId } = req.body;

    if (!promotionId) {
        return res.json({ discount: 0, total: subtotal });
    }

    try {
        const promotion = db.prepare(`
      SELECT * FROM promotions
      WHERE id = ? AND store_id = ? AND active = 1
      AND (start_date IS NULL OR start_date <= datetime('now'))
      AND (end_date IS NULL OR end_date >= datetime('now'))
    `).get(promotionId, req.storeId);

        if (!promotion) {
            return res.status(404).json({ error: 'Promoción no encontrada o inactiva' });
        }

        if (subtotal < promotion.min_purchase) {
            return res.json({
                discount: 0,
                total: subtotal,
                message: `Compra mínima: $${promotion.min_purchase}`
            });
        }

        let discount = 0;
        if (promotion.type === 'percentage') {
            discount = subtotal * (promotion.value / 100);
        } else {
            discount = promotion.value;
        }

        const total = Math.max(0, subtotal - discount);

        res.json({ discount, total, promotionName: promotion.name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

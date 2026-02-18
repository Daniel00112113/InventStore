import express from 'express';
import db from '../config/db.js';
import { authenticate, validateTenant } from '../middleware/auth.js';

const router = express.Router();

// GET /api/sales - Listar ventas con filtros opcionales
router.get('/', authenticate, validateTenant, (req, res) => {
    try {
        const { startDate, endDate, customerId, limit = 200 } = req.query;

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

// GET /api/sales/:id - Detalle de una venta con sus items
router.get('/:id', authenticate, validateTenant, (req, res) => {
    try {
        const saleId = req.params.id;

        const sale = db.prepare(`
            SELECT
                s.*,
                u.full_name as user_name,
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

export default router;

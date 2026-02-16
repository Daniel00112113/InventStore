import express from 'express';
import db from '../config/db.js';
import { authenticate, validateTenant } from '../middleware/auth.js';

const router = express.Router();

// Ventas por fecha
router.get('/sales-by-date', authenticate, validateTenant, (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Fechas requeridas' });
    }

    const sales = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total_sales,
      SUM(total) as total_amount,
      SUM(CASE WHEN payment_type = 'efectivo' THEN total ELSE 0 END) as cash_sales,
      SUM(CASE WHEN payment_type = 'fiado' THEN total ELSE 0 END) as credit_sales
    FROM sales
    WHERE store_id = ? AND DATE(created_at) BETWEEN ? AND ?
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).all(req.storeId, startDate, endDate);

    res.json(sales);
});

// Productos más vendidos
router.get('/top-products', authenticate, validateTenant, (req, res) => {
    const { startDate, endDate } = req.query;

    let query = `
    SELECT 
      p.id,
      p.name,
      SUM(si.quantity) as total_quantity,
      SUM(si.subtotal) as total_revenue
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE s.store_id = ?
  `;

    const params = [req.storeId];

    if (startDate && endDate) {
        query += ' AND DATE(s.created_at) BETWEEN ? AND ?';
        params.push(startDate, endDate);
    }

    query += ' GROUP BY p.id ORDER BY total_quantity DESC LIMIT 10';

    const products = db.prepare(query).all(...params);
    res.json(products);
});

// Ganancia neta
router.get('/profit', authenticate, validateTenant, (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Fechas requeridas' });
    }

    const profit = db.prepare(`
    SELECT 
      SUM(si.subtotal) as total_revenue,
      SUM(p.cost_price * si.quantity) as total_cost,
      SUM(si.subtotal - (p.cost_price * si.quantity)) as net_profit
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE s.store_id = ? AND DATE(s.created_at) BETWEEN ? AND ?
  `).get(req.storeId, startDate, endDate);

    res.json(profit);
});

// Clientes con mayor deuda
router.get('/top-debtors', authenticate, validateTenant, (req, res) => {
    const customers = db.prepare(`
    SELECT * FROM customers 
    WHERE store_id = ? AND balance > 0 
    ORDER BY balance DESC 
    LIMIT 10
  `).all(req.storeId);

    res.json(customers);
});

export default router;

import express from 'express';
import Database from 'better-sqlite3';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const db = new Database('database.db');

// Calcular resumen del día
function calculateDailySummary(storeId, date) {
    const startOfDay = `${date} 00:00:00`;
    const endOfDay = `${date} 23:59:59`;

    const summary = db.prepare(`
    SELECT 
      COALESCE(SUM(CASE 
        WHEN payment_type = 'efectivo' THEN total
        WHEN payment_type = 'mixto' THEN cash_amount
        ELSE 0
      END), 0) as expected_cash,
      COALESCE(SUM(CASE 
        WHEN payment_type = 'fiado' THEN total
        WHEN payment_type = 'mixto' THEN credit_amount
        ELSE 0
      END), 0) as credit_sales,
      COUNT(*) as total_transactions,
      SUM(CASE 
        WHEN payment_type IN ('efectivo', 'mixto') THEN 1
        ELSE 0
      END) as cash_transactions,
      SUM(CASE 
        WHEN payment_type = 'fiado' THEN 1
        ELSE 0
      END) as credit_transactions
    FROM sales
    WHERE store_id = ?
      AND created_at BETWEEN ? AND ?
      AND status = 'completed'
  `).get(storeId, startOfDay, endOfDay);

    return {
        date,
        expected_cash: summary.expected_cash || 0,
        credit_sales: summary.credit_sales || 0,
        total_transactions: summary.total_transactions || 0,
        cash_transactions: summary.cash_transactions || 0,
        credit_transactions: summary.credit_transactions || 0
    };
}

// GET /api/cash-register/summary - Obtener resumen del día
router.get('/summary', authenticate, (req, res) => {
    try {
        const { storeId } = req.user;
        const today = new Date().toISOString().split('T')[0];

        const summary = calculateDailySummary(storeId, today);

        res.json(summary);
    } catch (error) {
        console.error('Error al obtener resumen del día:', error);
        res.status(500).json({
            error: true,
            message: 'Error al obtener resumen del día',
            timestamp: new Date().toISOString()
        });
    }
});

// POST /api/cash-register/close - Crear cierre de caja
router.post('/close', authenticate, (req, res) => {
    try {
        const { storeId, userId } = req.user;
        const { actual_cash, notes } = req.body;

        // Validaciones
        if (typeof actual_cash !== 'number' || actual_cash < 0) {
            return res.status(400).json({
                error: true,
                message: 'El efectivo real debe ser un número positivo o cero',
                code: 'INVALID_ACTUAL_CASH',
                timestamp: new Date().toISOString()
            });
        }

        if (notes && notes.length > 500) {
            return res.status(400).json({
                error: true,
                message: 'Las notas no pueden exceder 500 caracteres',
                code: 'NOTES_TOO_LONG',
                timestamp: new Date().toISOString()
            });
        }

        const today = new Date().toISOString().split('T')[0];

        // Verificar si ya existe un cierre para hoy
        const existingClosing = db.prepare(`
      SELECT id FROM cash_register_closings
      WHERE store_id = ? AND closing_date = ?
    `).get(storeId, today);

        if (existingClosing) {
            return res.status(409).json({
                error: true,
                message: 'Ya existe un cierre de caja para esta fecha',
                code: 'DUPLICATE_CLOSING',
                timestamp: new Date().toISOString()
            });
        }

        // Calcular efectivo esperado
        const summary = calculateDailySummary(storeId, today);
        const expected_cash = summary.expected_cash;
        const difference = actual_cash - expected_cash;

        // Insertar cierre
        const result = db.prepare(`
      INSERT INTO cash_register_closings 
        (store_id, user_id, closing_date, expected_cash, actual_cash, difference, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(storeId, userId, today, expected_cash, actual_cash, difference, notes || null);

        res.status(201).json({
            id: result.lastInsertRowid,
            closing_date: today,
            expected_cash,
            actual_cash,
            difference,
            notes: notes || null,
            created_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error al crear cierre de caja:', error);

        if (error.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({
                error: true,
                message: 'Ya existe un cierre de caja para esta fecha',
                code: 'DUPLICATE_CLOSING',
                timestamp: new Date().toISOString()
            });
        }

        res.status(500).json({
            error: true,
            message: 'Error al crear cierre de caja',
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/cash-register/history - Obtener historial de cierres
router.get('/history', authenticate, (req, res) => {
    try {
        const { storeId } = req.user;
        const { limit = 50, offset = 0, start_date, end_date } = req.query;

        let query = `
      SELECT 
        c.id,
        c.closing_date,
        c.expected_cash,
        c.actual_cash,
        c.difference,
        c.notes,
        c.created_at,
        u.full_name as user_name
      FROM cash_register_closings c
      JOIN users u ON c.user_id = u.id
      WHERE c.store_id = ?
    `;

        const params = [storeId];

        // Filtros de fecha
        if (start_date) {
            query += ` AND c.closing_date >= ?`;
            params.push(start_date);
        }

        if (end_date) {
            query += ` AND c.closing_date <= ?`;
            params.push(end_date);
        }

        query += ` ORDER BY c.closing_date DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const closings = db.prepare(query).all(...params);

        // Contar total
        let countQuery = `
      SELECT COUNT(*) as total
      FROM cash_register_closings
      WHERE store_id = ?
    `;
        const countParams = [storeId];

        if (start_date) {
            countQuery += ` AND closing_date >= ?`;
            countParams.push(start_date);
        }

        if (end_date) {
            countQuery += ` AND closing_date <= ?`;
            countParams.push(end_date);
        }

        const { total } = db.prepare(countQuery).get(...countParams);

        res.json({
            closings: closings || [],
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error al obtener historial de cierres:', error);
        // Return empty structure on error to prevent frontend crashes
        res.status(500).json({
            closings: [],
            total: 0,
            limit: parseInt(req.query.limit || 50),
            offset: parseInt(req.query.offset || 0)
        });
    }
});

// GET /api/cash-register/export/:id - Exportar reporte de cierre
router.get('/export/:id', authenticate, (req, res) => {
    try {
        const { storeId } = req.user;
        const { id } = req.params;

        // Obtener cierre
        const closing = db.prepare(`
      SELECT 
        c.*,
        u.full_name as user_name,
        s.name as store_name,
        s.address as store_address,
        s.phone as store_phone
      FROM cash_register_closings c
      JOIN users u ON c.user_id = u.id
      JOIN stores s ON c.store_id = s.id
      WHERE c.id = ? AND c.store_id = ?
    `).get(id, storeId);

        if (!closing) {
            return res.status(404).json({
                error: true,
                message: 'Cierre de caja no encontrado',
                code: 'CLOSING_NOT_FOUND',
                timestamp: new Date().toISOString()
            });
        }

        // Obtener resumen del día
        const summary = calculateDailySummary(storeId, closing.closing_date);

        const report = {
            store: {
                name: closing.store_name,
                address: closing.store_address,
                phone: closing.store_phone
            },
            closing: {
                id: closing.id,
                date: closing.closing_date,
                user: closing.user_name,
                expected_cash: closing.expected_cash,
                actual_cash: closing.actual_cash,
                difference: closing.difference,
                notes: closing.notes
            },
            daily_summary: {
                cash_sales: summary.expected_cash,
                credit_sales: summary.credit_sales,
                total_sales: summary.expected_cash + summary.credit_sales,
                total_transactions: summary.total_transactions
            },
            generated_at: new Date().toISOString()
        };

        res.json(report);
    } catch (error) {
        console.error('Error al exportar cierre:', error);
        res.status(500).json({
            error: true,
            message: 'Error al exportar cierre',
            timestamp: new Date().toISOString()
        });
    }
});

export default router;

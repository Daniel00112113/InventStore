import express from 'express';
import Database from 'better-sqlite3';
import { authenticate, validateTenant } from '../middleware/auth.js';

const router = express.Router();
const db = new Database('database.db');

// Buscar facturas para devolución (DEBE IR ANTES DE GET /)
router.get('/search-sales', authenticate, validateTenant, (req, res) => {
    try {
        const { saleId, customerId, startDate, endDate } = req.query;

        let query = `
            SELECT s.id, s.created_at, s.total, s.payment_type, 
                   c.name as customer_name,
                   (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.store_id = ?
        `;

        const params = [req.user.storeId];

        if (saleId) {
            query += ' AND s.id = ?';
            params.push(saleId);
        }

        if (customerId) {
            query += ' AND s.customer_id = ?';
            params.push(customerId);
        }

        if (startDate) {
            query += ' AND DATE(s.created_at) >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND DATE(s.created_at) <= ?';
            params.push(endDate);
        }

        // Solo últimos 30 días por defecto
        if (!startDate && !endDate) {
            query += ' AND DATE(s.created_at) >= DATE("now", "-30 days")';
        }

        query += ' ORDER BY s.created_at DESC LIMIT 50';

        const sales = db.prepare(query).all(...params);
        res.json(sales);
    } catch (error) {
        console.error('Error searching sales:', error);
        res.status(500).json({ error: 'Error al buscar facturas', details: error.message });
    }
});

// Obtener productos de una factura (DEBE IR ANTES DE GET /:id)
router.get('/sale-items/:saleId', authenticate, validateTenant, (req, res) => {
    try {
        // Verificar que la venta pertenece a la tienda
        const sale = db.prepare('SELECT id FROM sales WHERE id = ? AND store_id = ?')
            .get(req.params.saleId, req.user.storeId);

        if (!sale) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        const items = db.prepare(`
            SELECT si.*, p.name as product_name, p.stock
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
        `).all(req.params.saleId);

        res.json(items);
    } catch (error) {
        console.error('Error getting sale items:', error);
        res.status(500).json({ error: 'Error al obtener productos de la factura' });
    }
});

// Crear devolución
router.post('/', authenticate, validateTenant, (req, res) => {
    const { saleId, customerId, items, reason } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Debe incluir productos' });
    }

    const transaction = db.transaction(() => {
        let totalAmount = 0;

        // Validar productos y calcular total
        for (const item of items) {
            const product = db.prepare('SELECT * FROM products WHERE id = ? AND store_id = ?')
                .get(item.productId, req.user.storeId);

            if (!product) {
                throw new Error(`Producto ${item.productId} no encontrado`);
            }

            totalAmount += item.unitPrice * item.quantity;
        }

        // Crear devolución
        const returnStmt = db.prepare(`
            INSERT INTO returns (store_id, sale_id, customer_id, total_amount, reason, processed_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const returnResult = returnStmt.run(
            req.user.storeId,
            saleId || null,
            customerId || null,
            totalAmount,
            reason || 'Sin especificar',
            req.user.userId
        );

        const returnId = returnResult.lastInsertRowid;

        // Crear items de devolución y devolver stock
        const itemStmt = db.prepare(`
            INSERT INTO return_items (return_id, product_id, quantity, unit_price, subtotal)
            VALUES (?, ?, ?, ?, ?)
        `);

        const stockStmt = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');

        for (const item of items) {
            const subtotal = item.unitPrice * item.quantity;
            itemStmt.run(returnId, item.productId, item.quantity, item.unitPrice, subtotal);
            stockStmt.run(item.quantity, item.productId);
        }

        // Si hay cliente, ajustar balance
        if (customerId) {
            db.prepare('UPDATE customers SET balance = balance - ? WHERE id = ?')
                .run(totalAmount, customerId);
        }

        return { returnId, totalAmount };
    });

    try {
        const result = transaction();
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Listar devoluciones
router.get('/', authenticate, validateTenant, (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let query = `
            SELECT r.*, u.full_name as processed_by_name, c.name as customer_name,
                   (SELECT COUNT(*) FROM return_items WHERE return_id = r.id) as items_count
            FROM returns r
            JOIN users u ON r.processed_by = u.id
            LEFT JOIN customers c ON r.customer_id = c.id
            WHERE r.store_id = ?
        `;

        const params = [req.user.storeId];

        if (startDate) {
            query += ' AND DATE(r.created_at) >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND DATE(r.created_at) <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY r.created_at DESC LIMIT 100';

        const returns = db.prepare(query).all(...params);

        // Always return an array, even if empty
        res.json(returns || []);
    } catch (error) {
        console.error('Error listing returns:', error);
        // Return empty array on error to prevent frontend crashes
        res.status(500).json([]);
    }
});

// Detalle de devolución
router.get('/:id', authenticate, validateTenant, (req, res) => {
    try {
        const returnData = db.prepare(`
            SELECT r.*, u.full_name as processed_by_name, c.name as customer_name
            FROM returns r
            JOIN users u ON r.processed_by = u.id
            LEFT JOIN customers c ON r.customer_id = c.id
            WHERE r.id = ? AND r.store_id = ?
        `).get(req.params.id, req.user.storeId);

        if (!returnData) {
            return res.status(404).json({ error: 'Devolución no encontrada' });
        }

        const items = db.prepare(`
            SELECT ri.*, p.name as product_name
            FROM return_items ri
            JOIN products p ON ri.product_id = p.id
            WHERE ri.return_id = ?
        `).all(req.params.id);

        res.json({ ...returnData, items });
    } catch (error) {
        console.error('Error getting return details:', error);
        res.status(500).json({ error: 'Error al obtener detalles de la devolución' });
    }
});

export default router;

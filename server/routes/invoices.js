import express from 'express';
import db from '../config/db.js';
import { authenticate, validateTenant } from '../middleware/auth.js';

const router = express.Router();

// Obtener todas las facturas/ventas
router.get('/', authenticate, validateTenant, (req, res) => {
    try {
        const { startDate, endDate, limit = 100 } = req.query;

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
                u.full_name as cashier_name,
                c.name as customer_name,
                COUNT(si.id) as items_count
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
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

        query += ` GROUP BY s.id ORDER BY s.created_at DESC LIMIT ?`;
        params.push(parseInt(limit));

        const invoices = db.prepare(query).all(...params);
        res.json(invoices);
    } catch (error) {
        console.error('Error getting invoices:', error);
        res.status(500).json({ error: 'Error al obtener facturas' });
    }
});

// Obtener detalles de una factura específica
router.get('/:id', authenticate, validateTenant, (req, res) => {
    try {
        const invoiceId = req.params.id;

        // Obtener información de la venta
        const sale = db.prepare(`
            SELECT
                s.*,
                u.full_name as cashier_name,
                c.name as customer_name,
                c.phone as customer_phone
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.id = ? AND s.store_id = ?
        `).get(invoiceId, req.storeId);

        if (!sale) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        // Obtener items de la venta
        const items = db.prepare(`
            SELECT
                si.*,
                p.name as product_name,
                p.barcode
            FROM sale_items si
            LEFT JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
        `).all(invoiceId);

        res.json({ ...sale, items });
    } catch (error) {
        console.error('Error getting invoice details:', error);
        res.status(500).json({ error: 'Error al obtener detalles de la factura' });
    }
});

// Anular una factura (restaura stock)
router.delete('/:id', authenticate, validateTenant, (req, res) => {
    try {
        const invoiceId = req.params.id;

        // Verificar que la factura existe y pertenece a la tienda
        const sale = db.prepare(`
            SELECT * FROM sales WHERE id = ? AND store_id = ?
        `).get(invoiceId, req.storeId);

        if (!sale) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        // Obtener items para restaurar stock
        const items = db.prepare(`
            SELECT product_id, quantity FROM sale_items WHERE sale_id = ?
        `).all(invoiceId);

        // Iniciar transacción
        const transaction = db.transaction(() => {
            // Restaurar stock de productos
            const updateStockStmt = db.prepare(`
                UPDATE products SET stock = stock + ? WHERE id = ?
            `);
            for (const item of items) {
                updateStockStmt.run(item.quantity, item.product_id);
            }

            // Si había crédito, reducir balance del cliente
            if (sale.credit_amount > 0 && sale.customer_id) {
                db.prepare(`
                    UPDATE customers SET balance = MAX(0, balance - ?) WHERE id = ?
                `).run(sale.credit_amount, sale.customer_id);
            }

            // Eliminar items de la venta
            db.prepare('DELETE FROM sale_items WHERE sale_id = ?').run(invoiceId);

            // Eliminar la venta
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
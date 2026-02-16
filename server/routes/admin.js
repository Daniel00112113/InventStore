import express from 'express';
import db from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Middleware para super admin (sin store_id)
const requireSuperAdmin = (req, res, next) => {
    if (req.user.storeId) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
};

// Listar todas las tiendas
router.get('/stores', authenticate, requireSuperAdmin, (req, res) => {
    const stores = db.prepare(`
    SELECT 
      s.*,
      COUNT(DISTINCT u.id) as user_count,
      COUNT(DISTINCT p.id) as product_count
    FROM stores s
    LEFT JOIN users u ON s.id = u.store_id
    LEFT JOIN products p ON s.id = p.store_id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `).all();

    res.json(stores);
});

// Cambiar estado de suscripción
router.patch('/stores/:id/subscription', authenticate, requireSuperAdmin, (req, res) => {
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
        return res.status(400).json({ error: 'Estado inválido' });
    }

    const stmt = db.prepare('UPDATE stores SET subscription_status = ? WHERE id = ?');
    const result = stmt.run(status, req.params.id);

    if (result.changes === 0) {
        return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    res.json({ success: true });
});

// Métricas globales
router.get('/metrics', authenticate, requireSuperAdmin, (req, res) => {
    const totalStores = db.prepare('SELECT COUNT(*) as count FROM stores').get();
    const activeStores = db.prepare("SELECT COUNT(*) as count FROM stores WHERE subscription_status = 'active'").get();
    const totalSales = db.prepare('SELECT COALESCE(SUM(total), 0) as total FROM sales').get();
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1').get();

    res.json({
        totalStores: totalStores.count,
        activeStores: activeStores.count,
        totalSales: totalSales.total,
        totalProducts: totalProducts.count
    });
});

export default router;

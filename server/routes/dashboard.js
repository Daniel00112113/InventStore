import express from 'express';
import db from '../config/db.js';
import { authenticate, validateTenant } from '../middleware/auth.js';

const router = express.Router();

// Cache simple en memoria (5 minutos)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCacheKey(storeId, date) {
  return `dashboard_${storeId}_${date}`;
}

router.get('/', authenticate, validateTenant, (req, res) => {
  const storeId = req.storeId;
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = getCacheKey(storeId, today);

  // Verificar caché
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  // Consulta optimizada única con subconsultas
  const stats = db.prepare(`
        SELECT 
            (SELECT COALESCE(SUM(total), 0) 
             FROM sales 
             WHERE store_id = ? AND DATE(created_at) = ?) as daily_sales,
            
            (SELECT COALESCE(SUM(total), 0) 
             FROM sales 
             WHERE store_id = ? AND DATE(created_at) >= ?) as monthly_sales,
            
            (SELECT COALESCE(SUM(si.subtotal - (p.cost_price * si.quantity)), 0)
             FROM sale_items si
             JOIN sales s ON si.sale_id = s.id
             JOIN products p ON si.product_id = p.id
             WHERE s.store_id = ? AND DATE(s.created_at) >= ?) as monthly_profit,
            
            (SELECT COUNT(*) 
             FROM products 
             WHERE store_id = ? AND stock <= min_stock AND active = 1) as low_stock_count,
            
            (SELECT COALESCE(SUM(balance), 0) 
             FROM customers 
             WHERE store_id = ? AND balance > 0) as pending_credit
    `).get(storeId, today, storeId, firstDayOfMonth, storeId, firstDayOfMonth, storeId, storeId);

  const result = {
    dailySales: stats.daily_sales,
    monthlySales: stats.monthly_sales,
    monthlyProfit: stats.monthly_profit,
    lowStockCount: stats.low_stock_count,
    pendingCredit: stats.pending_credit
  };

  // Guardar en caché
  cache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });

  // Limpiar caché antiguo cada 10 minutos
  if (Math.random() < 0.1) {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_TTL * 2) {
        cache.delete(key);
      }
    }
  }

  res.json(result);
});

// Endpoint para limpiar caché manualmente
router.post('/clear-cache', authenticate, validateTenant, (req, res) => {
  const storeId = req.storeId;
  let cleared = 0;

  for (const key of cache.keys()) {
    if (key.includes(`_${storeId}_`)) {
      cache.delete(key);
      cleared++;
    }
  }

  res.json({ message: `Cache cleared: ${cleared} entries` });
});

export default router;

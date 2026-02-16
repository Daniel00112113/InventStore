import express from 'express';
import db from '../config/db.js';
import { authenticate, validateTenant } from '../middleware/auth.js';
import { sanitizeProduct, validateProduct } from '../utils/validation.js';

const router = express.Router();

// Listar productos
router.get('/', authenticate, validateTenant, (req, res) => {
  const products = db.prepare(`
    SELECT * FROM products 
    WHERE store_id = ? AND active = 1 
    ORDER BY name
  `).all(req.storeId);

  res.json(products);
});

// Buscar por código de barras
router.get('/barcode/:barcode', authenticate, validateTenant, (req, res) => {
  const product = db.prepare(`
    SELECT * FROM products 
    WHERE store_id = ? AND barcode = ? AND active = 1
  `).get(req.storeId, req.params.barcode);

  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  res.json(product);
});

// Productos con bajo stock
router.get('/low-stock', authenticate, validateTenant, (req, res) => {
  const products = db.prepare(`
    SELECT * FROM products 
    WHERE store_id = ? AND stock <= min_stock AND active = 1
    ORDER BY stock ASC
  `).all(req.storeId);

  res.json(products);
});

// Crear producto
router.post('/', authenticate, validateTenant, (req, res) => {
  const { name, barcode, categoryId, costPrice, salePrice, stock, minStock, presentation, unitType, unitsPerPack, packPrice, wholesaleQuantity, wholesalePrice } = req.body;

  if (!name || !costPrice || !salePrice) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const stmt = db.prepare(`
    INSERT INTO products (store_id, name, barcode, category_id, cost_price, sale_price, stock, min_stock, presentation, unit_type, units_per_pack, pack_price, wholesale_quantity, wholesale_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    req.storeId,
    name,
    barcode || null,
    categoryId || null,
    costPrice,
    salePrice,
    stock || 0,
    minStock || 5,
    presentation || 'unidad',
    unitType || null,
    unitsPerPack || null,
    packPrice || null,
    wholesaleQuantity || null,
    wholesalePrice || null
  );

  res.status(201).json({ id: result.lastInsertRowid });
});

// Actualizar producto
router.put('/:id', authenticate, validateTenant, (req, res) => {
  const { name, barcode, categoryId, costPrice, salePrice, stock, minStock, presentation, unitType, unitsPerPack, packPrice, wholesaleQuantity, wholesalePrice } = req.body;

  const stmt = db.prepare(`
    UPDATE products 
    SET name = ?, barcode = ?, category_id = ?, cost_price = ?, sale_price = ?, stock = ?, min_stock = ?, presentation = ?, unit_type = ?, units_per_pack = ?, pack_price = ?, wholesale_quantity = ?, wholesale_price = ?
    WHERE id = ? AND store_id = ?
  `);

  const result = stmt.run(
    name,
    barcode,
    categoryId,
    costPrice,
    salePrice,
    stock,
    minStock,
    presentation || 'unidad',
    unitType || null,
    unitsPerPack || null,
    packPrice || null,
    wholesaleQuantity || null,
    wholesalePrice || null,
    req.params.id,
    req.storeId
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  res.json({ success: true });
});

// Eliminar producto (soft delete)
router.delete('/:id', authenticate, validateTenant, (req, res) => {
  const stmt = db.prepare('UPDATE products SET active = 0 WHERE id = ? AND store_id = ?');
  const result = stmt.run(req.params.id, req.storeId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  res.json({ success: true });
});

export default router;

import express from 'express';
import db from '../config/db.js';
import { authenticate, validateTenant } from '../middleware/auth.js';

const router = express.Router();

// --- Productos ---

// Listar productos (filtrar por ?categoryId=)
router.get('/', authenticate, validateTenant, (req, res) => {
    try {
        const { categoryId } = req.query;
        let query = 'SELECT * FROM products WHERE store_id = ? AND active = 1';
        const params = [req.storeId];

        if (categoryId) {
            query += ' AND category_id = ?';
            params.push(categoryId);
        }
        query += ' ORDER BY name';

        const products = db.prepare(query).all(...params);
        res.json(products);
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({
            error: 'Error al obtener productos',
            details: error.message
        });
    }
});

// Buscar por código de barras
router.get('/barcode/:barcode', authenticate, validateTenant, (req, res) => {
    const product = db.prepare(`
        SELECT * FROM products 
        WHERE store_id = ? AND barcode = ? AND active = 1
    `).get(req.storeId, req.params.barcode);

    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
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

    if (!name || costPrice == null || salePrice == null) {
        return res.status(400).json({ error: 'Datos incompletos' });
    }

    const result = db.prepare(`
        INSERT INTO products (store_id, name, barcode, category_id, cost_price, sale_price, stock, min_stock, presentation, unit_type, units_per_pack, pack_price, wholesale_quantity, wholesale_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        req.storeId, name, barcode || null, categoryId || null, costPrice, salePrice,
        stock ?? 0, minStock ?? 5, presentation || 'unidad',
        unitType || null, unitsPerPack || null, packPrice || null, wholesaleQuantity || null, wholesalePrice || null
    );

    res.status(201).json({ id: result.lastInsertRowid });
});

// --- Categorías (sub-ruta /api/products/categories) ---

const categoriesRouter = express.Router({ mergeParams: true });

categoriesRouter.get('/', authenticate, validateTenant, (req, res) => {
    const categories = db.prepare(`
        SELECT c.*, COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.active = 1
        WHERE c.store_id = ? AND c.active = 1
        GROUP BY c.id
        ORDER BY c.name
    `).all(req.storeId);
    res.json(categories);
});

categoriesRouter.post('/', authenticate, validateTenant, (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre requerido' });

    const result = db.prepare(`
        INSERT INTO categories (store_id, name, description) VALUES (?, ?, ?)
    `).run(req.storeId, name, description || null);
    res.status(201).json({ id: result.lastInsertRowid });
});

categoriesRouter.put('/:id', authenticate, validateTenant, (req, res) => {
    const { name, description } = req.body;
    const result = db.prepare(`
        UPDATE categories SET name = ?, description = ?
        WHERE id = ? AND store_id = ?
    `).run(name, description, req.params.id, req.storeId);

    if (result.changes === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json({ success: true });
});

categoriesRouter.delete('/:id', authenticate, validateTenant, (req, res) => {
    const result = db.prepare(`
        UPDATE categories SET active = 0 WHERE id = ? AND store_id = ?
    `).run(req.params.id, req.storeId);

    if (result.changes === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json({ success: true });
});

// Montar categorías antes de /:id para que 'categories' no se interprete como id
router.use('/categories', categoriesRouter);

// --- Productos por ID (después de /categories) ---

router.put('/:id', authenticate, validateTenant, (req, res) => {
    const { name, barcode, categoryId, costPrice, salePrice, stock, minStock, presentation, unitType, unitsPerPack, packPrice, wholesaleQuantity, wholesalePrice } = req.body;

    const result = db.prepare(`
        UPDATE products SET name = ?, barcode = ?, category_id = ?, cost_price = ?, sale_price = ?, stock = ?, min_stock = ?, presentation = ?, unit_type = ?, units_per_pack = ?, pack_price = ?, wholesale_quantity = ?, wholesale_price = ?
        WHERE id = ? AND store_id = ?
    `).run(name, barcode, categoryId, costPrice, salePrice, stock, minStock, presentation || 'unidad',
        unitType || null, unitsPerPack || null, packPrice || null, wholesaleQuantity || null, wholesalePrice || null,
        req.params.id, req.storeId);

    if (result.changes === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ success: true });
});

router.delete('/:id', authenticate, validateTenant, (req, res) => {
    const result = db.prepare('UPDATE products SET active = 0 WHERE id = ? AND store_id = ?')
        .run(req.params.id, req.storeId);

    if (result.changes === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ success: true });
});

export default router;

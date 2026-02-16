import express from 'express';
import db from '../config/db.js';
import { authenticate, validateTenant } from '../middleware/auth.js';

const router = express.Router();

// Listar categorías
router.get('/', authenticate, validateTenant, (req, res) => {
    try {
        const categories = db.prepare(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.active = 1
      WHERE c.store_id = ? AND c.active = 1
      GROUP BY c.id
      ORDER BY c.name
    `).all(req.storeId);

        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear categoría
router.post('/', authenticate, validateTenant, (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Nombre requerido' });
    }

    try {
        const stmt = db.prepare(`
      INSERT INTO categories (store_id, name, description)
      VALUES (?, ?, ?)
    `);

        const result = stmt.run(req.storeId, name, description || null);

        res.status(201).json({ id: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar categoría
router.put('/:id', authenticate, validateTenant, (req, res) => {
    const { name, description } = req.body;

    try {
        const stmt = db.prepare(`
      UPDATE categories 
      SET name = ?, description = ?
      WHERE id = ? AND store_id = ?
    `);

        const result = stmt.run(name, description, req.params.id, req.storeId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar categoría (soft delete)
router.delete('/:id', authenticate, validateTenant, (req, res) => {
    try {
        const stmt = db.prepare('UPDATE categories SET active = 0 WHERE id = ? AND store_id = ?');
        const result = stmt.run(req.params.id, req.storeId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

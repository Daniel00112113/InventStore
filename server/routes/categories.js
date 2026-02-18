import express from 'express';
import db from '../config/db.js';
import { authenticate, validateTenant } from '../middleware/auth.js';

const router = express.Router();

// Obtener todas las categorías
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
        console.error('Error getting categories:', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

// Crear nueva categoría
router.post('/', authenticate, validateTenant, (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const result = db.prepare(`
            INSERT INTO categories (store_id, name, description) VALUES (?, ?, ?)
        `).run(req.storeId, name, description || null);

        res.status(201).json({
            id: result.lastInsertRowid,
            name,
            description: description || null,
            store_id: req.storeId
        });
    } catch (error) {
        console.error('Error creating category:', error);
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
        } else {
            res.status(500).json({ error: 'Error al crear categoría' });
        }
    }
});

// Actualizar categoría
router.put('/:id', authenticate, validateTenant, (req, res) => {
    try {
        const { name, description } = req.body;
        const categoryId = req.params.id;

        if (!name) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const result = db.prepare(`
            UPDATE categories SET name = ?, description = ?
            WHERE id = ? AND store_id = ?
        `).run(name, description || null, categoryId, req.storeId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({
            id: categoryId,
            name,
            description: description || null,
            store_id: req.storeId
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Error al actualizar categoría' });
    }
});

// Eliminar categoría (soft delete)
router.delete('/:id', authenticate, validateTenant, (req, res) => {
    try {
        const categoryId = req.params.id;

        // Verificar si hay productos activos usando esta categoría
        const { count } = db.prepare(`
            SELECT COUNT(*) as count FROM products
            WHERE category_id = ? AND store_id = ? AND active = 1
        `).get(categoryId, req.storeId);

        if (count > 0) {
            return res.status(400).json({
                error: `No se puede eliminar la categoría porque tiene ${count} producto(s) asociado(s)`
            });
        }

        const result = db.prepare(`
            UPDATE categories SET active = 0 WHERE id = ? AND store_id = ?
        `).run(categoryId, req.storeId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({ message: 'Categoría eliminada exitosamente' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Error al eliminar categoría' });
    }
});

export default router;
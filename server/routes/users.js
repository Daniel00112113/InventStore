import express from 'express';
import bcrypt from 'bcrypt';
import db from '../config/db.js';
import { authenticate, requireAdmin, requireManager } from '../middleware/auth.js';

const router = express.Router();

// Listar usuarios de la tienda (admin y gerente)
router.get('/', authenticate, requireManager, (req, res) => {
    try {
        const { storeId } = req.user;

        const users = db.prepare(`
            SELECT id, username, full_name, role, active, created_at
            FROM users
            WHERE store_id = ?
            ORDER BY created_at DESC
        `).all(storeId);

        res.json(users);
    } catch (error) {
        console.error('Error listing users:', error);
        res.status(500).json({ error: 'Error al listar usuarios' });
    }
});

// Crear usuario (solo admin puede crear admin/gerente, gerente solo puede crear empleados)
router.post('/', authenticate, requireManager, (req, res) => {
    try {
        const { storeId, role: userRole } = req.user;
        const { username, password, fullName, role } = req.body;

        // Validaciones
        if (!username || !password || !fullName || !role) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        if (!['admin', 'gerente', 'empleado'].includes(role)) {
            return res.status(400).json({ error: 'Rol inválido' });
        }

        // Gerentes solo pueden crear empleados
        if (userRole === 'gerente' && role !== 'empleado') {
            return res.status(403).json({
                error: 'Los gerentes solo pueden crear empleados'
            });
        }

        // Validar longitud de contraseña
        if (password.length < 6) {
            return res.status(400).json({
                error: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar si el usuario ya existe
        const existing = db.prepare(
            'SELECT id FROM users WHERE store_id = ? AND username = ?'
        ).get(storeId, username);

        if (existing) {
            return res.status(409).json({
                error: 'El nombre de usuario ya existe'
            });
        }

        // Hash de la contraseña
        const passwordHash = bcrypt.hashSync(password, 10);

        // Crear usuario
        const result = db.prepare(`
            INSERT INTO users (store_id, username, password_hash, full_name, role)
            VALUES (?, ?, ?, ?, ?)
        `).run(storeId, username, passwordHash, fullName, role);

        res.status(201).json({
            id: result.lastInsertRowid,
            username,
            fullName,
            role,
            message: 'Usuario creado exitosamente'
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

// Actualizar usuario (admin y gerente pueden actualizar, pero gerente no puede modificar admin/gerente)
router.patch('/:id', authenticate, requireManager, (req, res) => {
    try {
        const { storeId, role: userRole } = req.user;
        const { fullName, active, password } = req.body;
        const userId = req.params.id;

        // Verificar que el usuario pertenece a la tienda
        const targetUser = db.prepare(
            'SELECT role FROM users WHERE id = ? AND store_id = ?'
        ).get(userId, storeId);

        if (!targetUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Gerentes no pueden modificar admin o gerente
        if (userRole === 'gerente' && targetUser.role !== 'empleado') {
            return res.status(403).json({
                error: 'Los gerentes solo pueden modificar empleados'
            });
        }

        const updates = [];
        const params = [];

        if (fullName !== undefined) {
            updates.push('full_name = ?');
            params.push(fullName);
        }

        if (active !== undefined) {
            updates.push('active = ?');
            params.push(active ? 1 : 0);
        }

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    error: 'La contraseña debe tener al menos 6 caracteres'
                });
            }
            updates.push('password_hash = ?');
            params.push(bcrypt.hashSync(password, 10));
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        params.push(userId, storeId);

        const result = db.prepare(`
            UPDATE users 
            SET ${updates.join(', ')}
            WHERE id = ? AND store_id = ?
        `).run(...params);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

// Eliminar usuario (solo admin)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
    try {
        const { storeId, userId: currentUserId } = req.user;
        const targetUserId = req.params.id;

        // No permitir auto-eliminación
        if (parseInt(targetUserId) === currentUserId) {
            return res.status(400).json({
                error: 'No puedes eliminar tu propio usuario'
            });
        }

        const result = db.prepare(
            'DELETE FROM users WHERE id = ? AND store_id = ?'
        ).run(targetUserId, storeId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

export default router;

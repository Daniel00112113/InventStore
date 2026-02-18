import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';

const router = express.Router();
const db = new Database('database.db');

// Middleware para verificar super admin
const authenticateSuperAdmin = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Token requerido' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        if (decoded.userType !== 'super_admin') {
            return res.status(403).json({ error: 'Acceso denegado: Se requiere Super Admin' });
        }

        req.superAdminId = decoded.userId;
        req.username = decoded.username;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

// Login de Super Admin
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
        }

        const superAdmin = db.prepare(`
            SELECT u.*, s.name as store_name 
            FROM users u 
            JOIN stores s ON u.store_id = s.id 
            WHERE u.username = ? AND (u.role = 'super_admin' OR u.username = 'superadmin') AND u.active = 1
        `).get(username);

        if (!superAdmin) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const validPassword = await bcrypt.compare(password, superAdmin.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            {
                userId: superAdmin.id,
                username: superAdmin.username,
                userType: 'super_admin'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: superAdmin.id,
                username: superAdmin.username,
                fullName: superAdmin.full_name,
                email: superAdmin.email,
                userType: 'super_admin'
            }
        });

    } catch (error) {
        console.error('Super admin login error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Dashboard de Super Admin
router.get('/dashboard', authenticateSuperAdmin, (req, res) => {
    try {
        // Estadísticas globales (sin datos sensibles)
        const totalStores = db.prepare('SELECT COUNT(*) as count FROM stores').get().count;
        const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        const activeInvitations = db.prepare('SELECT COUNT(*) as count FROM invitation_codes WHERE used = 0').get().count;
        const usedInvitations = db.prepare('SELECT COUNT(*) as count FROM invitation_codes WHERE used = 1').get().count;

        // Estadísticas por mes (últimos 6 meses)
        const monthlyStats = db.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as stores_created
      FROM stores 
      WHERE created_at >= datetime('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `).all();

        // Top 5 tiendas más activas (por número de ventas, sin montos)
        const topStores = db.prepare(`
      SELECT 
        s.name as store_name,
        s.owner_name,
        COUNT(sa.id) as total_sales,
        s.created_at
      FROM stores s
      LEFT JOIN sales sa ON s.id = sa.store_id
      GROUP BY s.id
      ORDER BY total_sales DESC
      LIMIT 5
    `).all();

        res.json({
            totalStores,
            totalUsers,
            activeInvitations,
            usedInvitations,
            monthlyStats,
            topStores
        });

    } catch (error) {
        console.error('Super admin dashboard error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Listar códigos de invitación
router.get('/invitation-codes', authenticateSuperAdmin, (req, res) => {
    try {
        const { status = 'all', limit = 50, offset = 0 } = req.query;

        let whereClause = '';
        if (status === 'active') {
            whereClause = 'WHERE used = 0 AND (expires_at IS NULL OR expires_at > datetime("now"))';
        } else if (status === 'used') {
            whereClause = 'WHERE used = 1';
        } else if (status === 'expired') {
            whereClause = 'WHERE used = 0 AND expires_at <= datetime("now")';
        }

        const codes = db.prepare(`
      SELECT 
        ic.*,
        s.name as actual_store_name
      FROM invitation_codes ic
      LEFT JOIN stores s ON ic.store_id = s.id
      ${whereClause}
      ORDER BY ic.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

        const total = db.prepare(`
      SELECT COUNT(*) as count FROM invitation_codes ic ${whereClause}
    `).get().count;

        res.json({
            codes,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Error listing invitation codes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Generar código de invitación
router.post('/generate-invitation', authenticateSuperAdmin, async (req, res) => {
    try {
        const { storeName, ownerName, ownerPhone, ownerAddress, expiresInDays = 30 } = req.body;

        if (!storeName || !ownerName) {
            return res.status(400).json({ error: 'Nombre de tienda y propietario son requeridos' });
        }

        // Generar código único
        const generateCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 8; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

        let code;
        let attempts = 0;

        do {
            code = generateCode();
            attempts++;
            if (attempts > 10) {
                throw new Error('No se pudo generar un código único');
            }
        } while (db.prepare('SELECT id FROM invitation_codes WHERE code = ?').get(code));

        const result = db.prepare(`
      INSERT INTO invitation_codes (code, store_name, owner_name, owner_phone, owner_address, expires_at)
      VALUES (?, ?, ?, ?, ?, datetime('now', '+${expiresInDays} days'))
    `).run(code, storeName, ownerName, ownerPhone || null, ownerAddress || null);

        res.status(201).json({
            id: result.lastInsertRowid,
            code,
            storeName,
            ownerName,
            ownerPhone,
            ownerAddress,
            expiresInDays,
            message: 'Código de invitación generado exitosamente'
        });

    } catch (error) {
        console.error('Error generating invitation code:', error);
        res.status(500).json({ error: error.message });
    }
});

// Desactivar código de invitación
router.delete('/invitation-codes/:id', authenticateSuperAdmin, (req, res) => {
    try {
        const { id } = req.params;

        const result = db.prepare(`
      UPDATE invitation_codes 
      SET expires_at = datetime('now', '-1 day')
      WHERE id = ? AND used = 0
    `).run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Código no encontrado o ya usado' });
        }

        res.json({ message: 'Código desactivado exitosamente' });

    } catch (error) {
        console.error('Error deactivating invitation code:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Listar tiendas (información básica, sin datos sensibles)
router.get('/stores', authenticateSuperAdmin, (req, res) => {
    try {
        const { limit = 50, offset = 0, search = '' } = req.query;

        let whereClause = '';
        let params = [limit, offset];

        if (search) {
            whereClause = 'WHERE s.name LIKE ? OR s.owner_name LIKE ?';
            params = [`%${search}%`, `%${search}%`, limit, offset];
        }

        const stores = db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.owner_name,
        s.phone,
        s.address,
        s.subscription_status,
        s.created_at,
        COUNT(u.id) as total_users,
        COUNT(sa.id) as total_sales
      FROM stores s
      LEFT JOIN users u ON s.id = u.store_id
      LEFT JOIN sales sa ON s.id = sa.store_id
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params);

        const totalParams = search ? [`%${search}%`, `%${search}%`] : [];
        const total = db.prepare(`
      SELECT COUNT(*) as count FROM stores s ${whereClause}
    `).get(...totalParams).count;

        res.json({
            stores,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Error listing stores:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Cambiar contraseña de Super Admin
router.put('/change-password', authenticateSuperAdmin, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
        }

        const superAdmin = db.prepare('SELECT * FROM super_admins WHERE id = ?').get(req.superAdminId);

        const validPassword = await bcrypt.compare(currentPassword, superAdmin.password_hash);

        if (!validPassword) {
            return res.status(400).json({ error: 'Contraseña actual incorrecta' });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        db.prepare(`
      UPDATE super_admins 
      SET password_hash = ? 
      WHERE id = ?
    `).run(newPasswordHash, req.superAdminId);

        res.json({ message: 'Contraseña actualizada exitosamente' });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener detalles de una tienda específica
router.get('/stores/:id', authenticateSuperAdmin, (req, res) => {
    try {
        const { id } = req.params;

        const store = db.prepare(`
            SELECT 
                s.id,
                s.name,
                s.owner_name,
                s.phone,
                s.address,
                s.subscription_status,
                s.created_at,
                COUNT(DISTINCT u.id) as total_users,
                COUNT(DISTINCT sa.id) as total_sales,
                COALESCE(SUM(sa.total), 0) as total_revenue
            FROM stores s
            LEFT JOIN users u ON s.id = u.store_id
            LEFT JOIN sales sa ON s.id = sa.store_id
            WHERE s.id = ?
            GROUP BY s.id
        `).get(id);

        if (!store) {
            return res.status(404).json({ error: 'Tienda no encontrada' });
        }

        // Obtener usuarios de la tienda
        const users = db.prepare(`
            SELECT id, username, full_name, user_type, created_at
            FROM users 
            WHERE store_id = ?
            ORDER BY created_at DESC
        `).all(id);

        // Obtener últimas ventas
        const recentSales = db.prepare(`
            SELECT id, total, created_at
            FROM sales 
            WHERE store_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        `).all(id);

        res.json({
            store,
            users,
            recentSales
        });

    } catch (error) {
        console.error('Error getting store details:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
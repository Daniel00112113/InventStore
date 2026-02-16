import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const router = express.Router();

// Validar código de invitación
router.post('/validate-code', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Código de invitación requerido' });
        }

        const invitation = db.prepare(`
      SELECT * FROM invitation_codes 
      WHERE code = ? AND used = 0 AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).get(code.toUpperCase());

        if (!invitation) {
            return res.status(404).json({ error: 'Código de invitación inválido o expirado' });
        }

        res.json({
            valid: true,
            store_name: invitation.store_name,
            owner_name: invitation.owner_name,
            owner_phone: invitation.owner_phone,
            owner_address: invitation.owner_address
        });

    } catch (error) {
        console.error('Error validating invitation code:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Registro con código de invitación
router.post('/register', async (req, res) => {
    try {
        const {
            invitationCode,
            username,
            password,
            fullName,
            storeName,
            ownerName,
            ownerPhone,
            ownerAddress
        } = req.body;

        // Validaciones
        if (!invitationCode || !username || !password || !fullName || !storeName || !ownerName) {
            return res.status(400).json({ error: 'Todos los campos obligatorios son requeridos' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Verificar código de invitación
        const invitation = db.prepare(`
      SELECT * FROM invitation_codes 
      WHERE code = ? AND used = 0 AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).get(invitationCode.toUpperCase());

        if (!invitation) {
            return res.status(400).json({ error: 'Código de invitación inválido o expirado' });
        }

        // Hash de la contraseña antes de la transacción
        const passwordHash = await bcrypt.hash(password, 10);

        // Ejecutar transacción
        const transaction = db.transaction(() => {
            // Crear la tienda
            const storeResult = db.prepare(`
        INSERT INTO stores (name, owner_name, phone, address)
        VALUES (?, ?, ?, ?)
      `).run(storeName, ownerName, ownerPhone || null, ownerAddress || null);

            const storeId = storeResult.lastInsertRowid;

            // Verificar que el username no existe en esta tienda
            const existingUser = db.prepare(`
        SELECT id FROM users WHERE store_id = ? AND username = ?
      `).get(storeId, username);

            if (existingUser) {
                throw new Error('El nombre de usuario ya existe');
            }

            // Crear el usuario administrador
            const userResult = db.prepare(`
        INSERT INTO users (store_id, username, password_hash, full_name, role)
        VALUES (?, ?, ?, ?, 'admin')
      `).run(storeId, username, passwordHash, fullName);

            const userId = userResult.lastInsertRowid;

            // Marcar código como usado
            db.prepare(`
        UPDATE invitation_codes 
        SET used = 1, used_at = datetime('now'), store_id = ?
        WHERE id = ?
      `).run(storeId, invitation.id);

            // Crear categorías por defecto
            const defaultCategories = [
                'Bebidas',
                'Snacks',
                'Dulces',
                'Productos de Limpieza',
                'Cuidado Personal'
            ];

            const insertCategory = db.prepare(`
        INSERT INTO categories (store_id, name, description)
        VALUES (?, ?, ?)
      `);

            defaultCategories.forEach(categoryName => {
                insertCategory.run(storeId, categoryName, `Categoría ${categoryName}`);
            });

            return { userId, storeId, storeName };
        });

        const result = transaction();

        // Generar token JWT
        const token = jwt.sign(
            {
                userId: result.userId,
                storeId: result.storeId,
                username,
                role: 'admin'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: result.userId,
                username,
                fullName,
                role: 'admin',
                storeId: result.storeId,
                storeName: result.storeName
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Generar nuevo código de invitación (solo para desarrollo/admin)
router.post('/generate-code', async (req, res) => {
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

        // Asegurar que el código sea único
        do {
            code = generateCode();
            attempts++;
            if (attempts > 10) {
                throw new Error('No se pudo generar un código único');
            }
        } while (db.prepare('SELECT id FROM invitation_codes WHERE code = ?').get(code));

        // Insertar código
        const result = db.prepare(`
      INSERT INTO invitation_codes (code, store_name, owner_name, owner_phone, owner_address, expires_at)
      VALUES (?, ?, ?, ?, ?, datetime('now', '+${expiresInDays} days'))
    `).run(code, storeName, ownerName, ownerPhone || null, ownerAddress || null);

        res.status(201).json({
            code,
            storeName,
            ownerName,
            expiresInDays,
            message: 'Código de invitación generado exitosamente'
        });

    } catch (error) {
        console.error('Error generating invitation code:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
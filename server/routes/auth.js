import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';

const router = express.Router();
const db = new Database('database.db');

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        console.log('Login failed: Missing credentials');
        return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const user = db.prepare(`
    SELECT u.*, s.subscription_status 
    FROM users u 
    JOIN stores s ON u.store_id = s.id 
    WHERE u.username = ? AND u.active = 1
  `).get(username);

    if (!user) {
        console.log(`Login failed: User not found or inactive - ${username}`);
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (user.subscription_status !== 'active') {
        console.log(`Login failed: Inactive subscription - ${username}`);
        return res.status(403).json({ error: 'Suscripción inactiva' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);

    if (!validPassword) {
        console.log(`Login failed: Invalid password - ${username}`);
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
        {
            userId: user.id,
            storeId: user.store_id,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    console.log(`Login successful: ${username}`);
    res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            fullName: user.full_name,
            role: user.role,
            storeId: user.store_id
        }
    });
});

export default router;

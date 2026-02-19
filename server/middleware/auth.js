import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';

const db = new Database('database.db');

export const authenticate = (req, res, next) => {
    try {
        // Intentar obtener token del header o query string
        const token = req.headers.authorization?.split(' ')[1] || req.query.token;

        if (!token) {
            return res.status(401).json({
                error: 'Token de acceso requerido',
                code: 'NO_TOKEN'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            req.userId = decoded.userId;
            req.storeId = decoded.storeId;
            req.userRole = decoded.role;

            // Log de acceso para debugging
            console.log(`🔐 Auth: User ${decoded.userId} (${decoded.role}) accessing ${req.method} ${req.path}`);

            next();
        } catch (jwtError) {
            console.warn('🚫 JWT verification failed:', jwtError.message);

            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token expirado. Por favor, inicia sesión nuevamente.',
                    code: 'TOKEN_EXPIRED'
                });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    error: 'Token inválido',
                    code: 'INVALID_TOKEN'
                });
            } else {
                return res.status(401).json({
                    error: 'Error de autenticación',
                    code: 'AUTH_ERROR'
                });
            }
        }
    } catch (error) {
        console.error('🚨 Authentication middleware error:', error);
        return res.status(500).json({
            error: 'Error interno de autenticación',
            code: 'INTERNAL_AUTH_ERROR'
        });
    }
};

// Middleware de autenticación para exportaciones (devuelve HTML en caso de error)
export const authenticateExport = (req, res, next) => {
    const token = req.query.token;

    if (!token) {
        return res.status(401).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Error de Autenticación</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
                    .error { color: #d32f2f; font-size: 18px; margin: 20px 0; }
                    button { padding: 12px 24px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
                </style>
            </head>
            <body>
                <h1>⚠️ Error de Autenticación</h1>
                <p class="error">Token requerido para acceder a este reporte</p>
                <button onclick="window.close()">Cerrar</button>
            </body>
            </html>
        `);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Error de Autenticación</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
                    .error { color: #d32f2f; font-size: 18px; margin: 20px 0; }
                    button { padding: 12px 24px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
                </style>
            </head>
            <body>
                <h1>⚠️ Error de Autenticación</h1>
                <p class="error">Token inválido o expirado</p>
                <p>Por favor, inicie sesión nuevamente</p>
                <button onclick="window.close()">Cerrar</button>
            </body>
            </html>
        `);
    }
};

export const validateTenant = (req, res, next) => {
    const storeId = req.user.storeId;

    // Verificar que la tienda esté activa
    const store = db.prepare('SELECT subscription_status FROM stores WHERE id = ?').get(storeId);

    if (!store) {
        return res.status(403).json({ error: 'Tienda no encontrada' });
    }

    if (store.subscription_status !== 'active') {
        return res.status(403).json({ error: 'Suscripción inactiva' });
    }

    req.storeId = storeId;
    next();
};

export const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
};

// Middleware para admin o gerente
export const requireManager = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'gerente') {
        return res.status(403).json({ error: 'Acceso denegado - Se requiere rol de gerente o admin' });
    }
    next();
};

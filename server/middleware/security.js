// Middleware de seguridad

const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_REQUESTS = 100; // 100 requests por minuto

export function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }

    const record = requestCounts.get(ip);

    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + RATE_LIMIT_WINDOW;
        return next();
    }

    if (record.count >= MAX_REQUESTS) {
        return res.status(429).json({
            error: 'Demasiadas solicitudes. Por favor intente más tarde.',
            retryAfter: Math.ceil((record.resetTime - now) / 1000)
        });
    }

    record.count++;
    next();
}

// Limpiar registros antiguos cada 5 minutos
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of requestCounts.entries()) {
        if (now > record.resetTime + RATE_LIMIT_WINDOW) {
            requestCounts.delete(ip);
        }
    }
}, 5 * 60 * 1000);

export function validateContentType(req, res, next) {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
            return res.status(400).json({
                error: 'Content-Type debe ser application/json'
            });
        }
    }
    next();
}

export function sanitizeBody(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        // Eliminar propiedades peligrosas
        delete req.body.__proto__;
        delete req.body.constructor;
        delete req.body.prototype;
    }
    next();
}

export function logRequest(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const log = {
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress
        };

        // Solo loguear errores y requests lentos
        if (res.statusCode >= 400 || duration > 1000) {
            console.log('[REQUEST]', JSON.stringify(log));
        }
    });

    next();
}

export function errorHandler(err, req, res, next) {
    console.error('[ERROR]', {
        timestamp: new Date().toISOString(),
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    // No exponer detalles internos en producción
    const isDev = process.env.NODE_ENV === 'development';

    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor',
        ...(isDev && { stack: err.stack })
    });
}

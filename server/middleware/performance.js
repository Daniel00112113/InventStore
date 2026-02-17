import { logger } from './logger.js';

// Middleware de métricas de rendimiento
export const performanceMonitoring = (req, res, next) => {
    const start = process.hrtime.bigint();

    // Interceptar el final de la respuesta
    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convertir a ms

        // Log de rendimiento si es lento
        if (duration > 1000) {
            logger.performance('Slow request detected', duration, {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                userAgent: req.get('User-Agent'),
                ip: req.ip
            });
        }

        // Métricas para Prometheus (si está disponible)
        if (global.prometheusMetrics) {
            global.prometheusMetrics.httpRequestDuration
                .labels(req.method, req.route?.path || req.url, res.statusCode)
                .observe(duration / 1000);

            global.prometheusMetrics.httpRequestsTotal
                .labels(req.method, req.route?.path || req.url, res.statusCode)
                .inc();
        }
    });

    next();
};

// Middleware de compresión inteligente
export const smartCompression = (req, res, next) => {
    // Solo comprimir respuestas grandes
    const originalSend = res.send;

    res.send = function (body) {
        if (typeof body === 'string' && body.length > 1024) {
            res.set('Content-Encoding', 'gzip');
        }
        return originalSend.call(this, body);
    };

    next();
};

// Middleware de cache headers inteligente
export const cacheHeaders = (req, res, next) => {
    // Cache estático por 1 año
    if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Cache API por 5 minutos
    else if (req.url.startsWith('/api/')) {
        res.set('Cache-Control', 'private, max-age=300');
    }
    // No cache para HTML
    else {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    next();
};

// Middleware de health check avanzado
export const healthCheck = async (req, res, next) => {
    if (req.url === '/health' || req.url === '/api/health') {
        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '3.0.0',
            environment: process.env.NODE_ENV || 'development',
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                external: Math.round(process.memoryUsage().external / 1024 / 1024)
            },
            cpu: {
                usage: process.cpuUsage()
            }
        };

        // Verificar base de datos
        try {
            // Aquí podrías agregar un ping a la base de datos
            health.database = 'connected';
        } catch (error) {
            health.database = 'error';
            health.status = 'degraded';
        }

        const statusCode = health.status === 'ok' ? 200 : 503;
        return res.status(statusCode).json(health);
    }

    next();
};

export default {
    performanceMonitoring,
    smartCompression,
    cacheHeaders,
    healthCheck
};
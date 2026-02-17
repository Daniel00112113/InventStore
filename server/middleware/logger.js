import winston from 'winston';

// Configurar Winston logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'inventstore-api' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Middleware de logging para requests
export const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Generar ID único para el request
    req.requestId = Math.random().toString(36).substring(7);

    // Log del request
    logger.info('Request started', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Interceptar el final del response
    res.on('finish', () => {
        const duration = Date.now() - start;

        logger.info('Request completed', {
            requestId: req.requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`
        });
    });

    next();
};

// Middleware de rate limiting simple
const requestCounts = new Map();

export const simpleRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();

        if (!requestCounts.has(key)) {
            requestCounts.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }

        const data = requestCounts.get(key);

        if (now > data.resetTime) {
            data.count = 1;
            data.resetTime = now + windowMs;
            return next();
        }

        if (data.count >= maxRequests) {
            logger.warn('Rate limit exceeded', {
                ip: req.ip,
                count: data.count,
                limit: maxRequests
            });

            return res.status(429).json({
                error: 'Too Many Requests',
                retryAfter: Math.ceil((data.resetTime - now) / 1000)
            });
        }

        data.count++;
        next();
    };
};

export { logger };
export default logger;
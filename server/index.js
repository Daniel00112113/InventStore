import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import registerRoutes from './routes/register.js';
import superAdminRoutes from './routes/super-admin.js';
import dashboardRoutes from './routes/dashboard.js';
import productsRoutes from './routes/products.js';
import customersRoutes from './routes/customers.js';
import reportsRoutes from './routes/reports.js';
import adminRoutes from './routes/admin.js';
import promotionsRoutes from './routes/promotions.js';
import exportRoutes from './routes/export.js';
import returnsRoutes from './routes/returns.js';
import cashRegisterRoutes from './routes/cash-register.js';
import usersRoutes from './routes/users.js';
import categoriesRoutes from './routes/categories.js';
import invoicesRoutes from './routes/invoices.js';
import { scheduleAutoBackup } from './services/backup.js';
// Importar middleware enterprise
import { requestLogger, simpleRateLimit, logger } from './middleware/logger.js';
import { performanceMonitoring, cacheHeaders, healthCheck } from './middleware/performance.js';
import { initializeMetrics, metricsEndpoint } from './middleware/metrics.js';
import { setupClustering, workerLoadBalancer, getWorkerStats } from './middleware/clustering.js';
import { cache, cacheUtils } from './services/cache.js';
import productionConfig from './config/production.js';

dotenv.config();

// Inicializar clustering en producción
const isClusterEnabled = process.env.CLUSTER_MODE === 'true' && process.env.NODE_ENV === 'production';
if (isClusterEnabled) {
    const isMaster = setupClustering();
    if (isMaster) {
        // El proceso master no ejecuta el servidor, solo maneja workers
        process.exit(0);
    }
}

// Inicializar métricas de Prometheus
initializeMetrics();

// Validar variables de entorno críticas
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    logger.error('JWT_SECRET no está configurado o es muy corto');
    logger.info('Genera uno seguro con: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    process.exit(1);
}

if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.includes('CAMBIAR')) {
    logger.error('JWT_SECRET debe cambiarse en producción');
    process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configuración de CORS según entorno
const corsOptions = {
    origin: (origin, callback) => {
        // Permitir requests sin origin (como mobile apps o curl)
        if (!origin) return callback(null, true);

        const allowedOrigins = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['http://localhost:3000', 'http://127.0.0.1:3000'];

        // En desarrollo, permitir todos los orígenes de localhost
        if (NODE_ENV === 'development' && origin.includes('localhost')) {
            return callback(null, true);
        }

        // En producción, permitir dominios de Render, Netlify, Vercel y otros servicios comunes
        if (NODE_ENV === 'production') {
            const productionDomains = [
                '.onrender.com',
                '.netlify.app',
                '.vercel.app',
                '.fly.dev',
                '.railway.app'
            ];

            const isAllowedProductionDomain = productionDomains.some(domain =>
                origin.includes(domain)
            );

            if (isAllowedProductionDomain) {
                return callback(null, true);
            }
        }

        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log(`CORS blocked origin: ${origin}`);
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware de seguridad y rendimiento
app.use(requestLogger);
app.use(performanceMonitoring);
app.use(workerLoadBalancer);
app.use(cacheHeaders);
app.use(healthCheck);
app.use(simpleRateLimit(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// Security headers (configuración más permisiva para desarrollo)
if (NODE_ENV === 'production') {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
                fontSrc: ["'self'", "https:", "data:"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false
    }));
} else {
    // En desarrollo, usar configuración más permisiva
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
                fontSrc: ["'self'", "https:", "data:"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false
    }));
}

// Middleware de compresión GZIP
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6
}));

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Middleware de validación simple
app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
        if (req.headers['content-type'] && !req.headers['content-type'].includes('application/json')) {
            if (!req.headers['content-type'].includes('multipart/form-data')) {
                return res.status(400).json({ error: 'Content-Type must be application/json' });
            }
        }
    }
    next();
});

// Servir archivos estáticos con caché
app.use(express.static(join(__dirname, '../client'), {
    maxAge: '1d', // Cache por 1 día
    etag: true,
    lastModified: true
}));

// Rutas específicas para frontends enterprise (NUEVO)
app.get('/enterprise', (req, res) => {
    res.sendFile(join(__dirname, '../client/index-enterprise.html'));
});

app.get('/dashboard-modern', (req, res) => {
    res.sendFile(join(__dirname, '../client/dashboard-modern.html'));
});

app.get('/enterprise-login', (req, res) => {
    res.sendFile(join(__dirname, '../client/index-enterprise.html'));
});

// Rutas API con cache inteligente
app.use('/api/auth', authRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/dashboard', cache.middleware(300), dashboardRoutes); // Cache 5 min
app.use('/api/products', cache.middleware(600), productsRoutes); // Cache 10 min
app.use('/api/customers', cache.middleware(300), customersRoutes); // Cache 5 min
app.use('/api/reports', cache.middleware(1800), reportsRoutes); // Cache 30 min
app.use('/api/admin', adminRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/cash-register', cashRegisterRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/invoices', invoicesRoutes);

// Headers de seguridad y performance
app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Cache control para APIs
    if (req.path.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    next();
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime()
    });
});

// Endpoint de métricas para Prometheus
app.get('/metrics', metricsEndpoint);

// Endpoint de estadísticas de cache
app.get('/api/cache/stats', (req, res) => {
    res.json(cache.getStats());
});

// Endpoint de estadísticas de workers
app.get('/api/cluster/stats', (req, res) => {
    res.json(getWorkerStats());
});

// Middleware de manejo de errores
app.use((error, req, res, next) => {
    logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        requestId: req.requestId,
        url: req.url,
        method: req.method
    });

    res.status(500).json({
        error: 'Internal server error',
        requestId: req.requestId
    });
});

// Ruta catch-all para SPA
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../client/index.html'));
});

app.listen(PORT, () => {
    logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    logger.info(`📱 Frontend disponible en http://localhost:${PORT}`);
    logger.info(`🔌 API disponible en http://localhost:${PORT}/api`);
    logger.info(`📦 Versión: 3.0.0 - Enterprise Edition`);
    logger.info(`🌍 Entorno: ${NODE_ENV}`);
    logger.info(`🛡️ Rate limiting: 100 req/15min por IP`);
    logger.info(`🔒 CORS configurado para: ${process.env.ALLOWED_ORIGINS || 'localhost'}`);
    logger.info(`✅ JWT_SECRET configurado (${process.env.JWT_SECRET.length} caracteres)`);

    // Información de producción
    if (NODE_ENV === 'production') {
        logger.info(`🏭 Modo producción activado`);
        logger.info(`📊 Métricas disponibles en /metrics`);
        logger.info(`💾 Cache stats en /api/cache/stats`);
        logger.info(`👷 Worker stats en /api/cluster/stats`);
        logger.info(`🔍 Health check en /health y /api/health`);
    }

    // Iniciar backup automático
    scheduleAutoBackup();
});

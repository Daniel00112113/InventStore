import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import registerRoutes from './routes/register.js';
import superAdminRoutes from './routes/super-admin.js';
import dashboardRoutes from './routes/dashboard.js';
import productsRoutes from './routes/products.js';
import salesRoutes from './routes/sales.js';
import customersRoutes from './routes/customers.js';
import reportsRoutes from './routes/reports.js';
import adminRoutes from './routes/admin.js';
import categoriesRoutes from './routes/categories.js';
import promotionsRoutes from './routes/promotions.js';
import exportRoutes from './routes/export.js';
import returnsRoutes from './routes/returns.js';
import cashRegisterRoutes from './routes/cash-register.js';
import usersRoutes from './routes/users.js';
import { scheduleAutoBackup } from './services/backup.js';
import { rateLimiter, validateContentType, sanitizeBody, logRequest, errorHandler } from './middleware/security.js';

dotenv.config();

// Validar variables de entorno críticas
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('❌ ERROR: JWT_SECRET no está configurado o es muy corto');
    console.error('💡 Genera uno seguro con: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    process.exit(1);
}

if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.includes('CAMBIAR')) {
    console.error('❌ ERROR: JWT_SECRET debe cambiarse en producción');
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

// Middleware de seguridad
app.use(logRequest);
app.use(rateLimiter);

// Middleware de compresión GZIP
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6 // Nivel de compresión (0-9)
}));

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Límite de tamaño de payload
app.use(validateContentType);
app.use(sanitizeBody);

// Servir archivos estáticos con caché
app.use(express.static(join(__dirname, '../client'), {
    maxAge: '1d', // Cache por 1 día
    etag: true,
    lastModified: true
}));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/cash-register', cashRegisterRoutes);
app.use('/api/users', usersRoutes);

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
    res.json({ status: 'ok', version: '2.0.0' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() });
});

// Ruta catch-all para SPA
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../client/index.html'));
});

// Manejador de errores global (debe ir al final)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📱 Frontend disponible en http://localhost:${PORT}`);
    console.log(`🔌 API disponible en http://localhost:${PORT}/api`);
    console.log(`📦 Versión: 3.1.0 - Con mejoras de robustez`);
    console.log(`🌍 Entorno: ${NODE_ENV}`);
    console.log(`🛡️ Rate limiting: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} req/min por IP`);
    console.log(`🔒 CORS configurado para: ${process.env.ALLOWED_ORIGINS || 'localhost'}`);
    console.log(`✅ JWT_SECRET configurado (${process.env.JWT_SECRET.length} caracteres)`);

    // Iniciar backup automático
    scheduleAutoBackup();
});

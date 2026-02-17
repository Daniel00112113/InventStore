// Métricas de Prometheus para producción
let prometheusClient;
let register;
let metrics = {};

// Inicializar métricas solo si Prometheus está disponible
export const initializeMetrics = () => {
    try {
        // Intentar cargar prom-client solo si está instalado
        prometheusClient = require('prom-client');
        register = new prometheusClient.Registry();

        // Métricas por defecto del sistema
        prometheusClient.collectDefaultMetrics({ register });

        // Métricas personalizadas
        metrics = {
            httpRequestsTotal: new prometheusClient.Counter({
                name: 'http_requests_total',
                help: 'Total number of HTTP requests',
                labelNames: ['method', 'route', 'status_code'],
                registers: [register]
            }),

            httpRequestDuration: new prometheusClient.Histogram({
                name: 'http_request_duration_seconds',
                help: 'Duration of HTTP requests in seconds',
                labelNames: ['method', 'route', 'status_code'],
                buckets: [0.1, 0.5, 1, 2, 5],
                registers: [register]
            }),

            activeConnections: new prometheusClient.Gauge({
                name: 'active_connections',
                help: 'Number of active connections',
                registers: [register]
            }),

            databaseQueries: new prometheusClient.Counter({
                name: 'database_queries_total',
                help: 'Total number of database queries',
                labelNames: ['operation', 'table'],
                registers: [register]
            }),

            salesTotal: new prometheusClient.Counter({
                name: 'sales_total',
                help: 'Total sales amount',
                labelNames: ['store_id'],
                registers: [register]
            }),

            inventoryLevels: new prometheusClient.Gauge({
                name: 'inventory_levels',
                help: 'Current inventory levels',
                labelNames: ['product_id', 'store_id'],
                registers: [register]
            })
        };

        // Hacer métricas disponibles globalmente
        global.prometheusMetrics = metrics;
        global.prometheusRegister = register;

        console.log('✅ Prometheus metrics initialized');
        return true;
    } catch (error) {
        console.log('ℹ️  Prometheus not available, metrics disabled');
        return false;
    }
};

// Middleware para exponer métricas
export const metricsEndpoint = async (req, res) => {
    if (!register) {
        return res.status(404).send('Metrics not available');
    }

    try {
        res.set('Content-Type', register.contentType);
        const metrics = await register.metrics();
        res.end(metrics);
    } catch (error) {
        res.status(500).send('Error generating metrics');
    }
};

// Funciones de utilidad para métricas de negocio
export const recordSale = (storeId, amount) => {
    if (metrics.salesTotal) {
        metrics.salesTotal.labels(storeId).inc(amount);
    }
};

export const updateInventoryLevel = (productId, storeId, level) => {
    if (metrics.inventoryLevels) {
        metrics.inventoryLevels.labels(productId, storeId).set(level);
    }
};

export const recordDatabaseQuery = (operation, table) => {
    if (metrics.databaseQueries) {
        metrics.databaseQueries.labels(operation, table).inc();
    }
};

export default {
    initializeMetrics,
    metricsEndpoint,
    recordSale,
    updateInventoryLevel,
    recordDatabaseQuery
};
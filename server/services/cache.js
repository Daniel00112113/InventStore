// Sistema de cache inteligente para producción
class CacheService {
    constructor() {
        this.memoryCache = new Map();
        this.redisClient = null;
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };

        this.initializeRedis();
    }

    async initializeRedis() {
        try {
            // Intentar conectar a Redis solo si está configurado
            if (process.env.REDIS_HOST) {
                const { createClient } = await import('redis');
                this.redisClient = createClient({
                    socket: {
                        host: process.env.REDIS_HOST,
                        port: process.env.REDIS_PORT || 6379
                    },
                    password: process.env.REDIS_PASSWORD
                });

                await this.redisClient.connect();
                console.log('✅ Redis cache connected');
            }
        } catch (error) {
            console.log('ℹ️  Redis not available, using memory cache only');
        }
    }

    // Generar clave de cache
    generateKey(prefix, ...parts) {
        return `${prefix}:${parts.join(':')}`;
    }

    // Obtener del cache
    async get(key) {
        try {
            let value = null;

            // Intentar Redis primero
            if (this.redisClient) {
                value = await this.redisClient.get(key);
                if (value) {
                    this.stats.hits++;
                    return JSON.parse(value);
                }
            }

            // Fallback a memoria
            const memoryValue = this.memoryCache.get(key);
            if (memoryValue && memoryValue.expires > Date.now()) {
                this.stats.hits++;
                return memoryValue.data;
            }

            // Limpiar cache expirado de memoria
            if (memoryValue && memoryValue.expires <= Date.now()) {
                this.memoryCache.delete(key);
            }

            this.stats.misses++;
            return null;
        } catch (error) {
            console.error('Cache get error:', error);
            this.stats.misses++;
            return null;
        }
    }

    // Guardar en cache
    async set(key, value, ttlSeconds = 300) {
        try {
            const serialized = JSON.stringify(value);

            // Guardar en Redis
            if (this.redisClient) {
                await this.redisClient.setEx(key, ttlSeconds, serialized);
            }

            // Guardar en memoria como backup
            this.memoryCache.set(key, {
                data: value,
                expires: Date.now() + (ttlSeconds * 1000)
            });

            // Limpiar memoria si está muy llena
            if (this.memoryCache.size > 1000) {
                this.cleanMemoryCache();
            }

            this.stats.sets++;
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    // Eliminar del cache
    async delete(key) {
        try {
            if (this.redisClient) {
                await this.redisClient.del(key);
            }

            this.memoryCache.delete(key);
            this.stats.deletes++;
            return true;
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    }

    // Limpiar cache expirado de memoria
    cleanMemoryCache() {
        const now = Date.now();
        for (const [key, value] of this.memoryCache.entries()) {
            if (value.expires <= now) {
                this.memoryCache.delete(key);
            }
        }
    }

    // Obtener estadísticas
    getStats() {
        const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) * 100;

        return {
            ...this.stats,
            hitRate: isNaN(hitRate) ? 0 : hitRate.toFixed(2),
            memorySize: this.memoryCache.size,
            redisConnected: !!this.redisClient
        };
    }

    // Middleware de cache para Express
    middleware(ttlSeconds = 300) {
        return async (req, res, next) => {
            // Solo cachear GET requests
            if (req.method !== 'GET') {
                return next();
            }

            const cacheKey = this.generateKey('http', req.method, req.originalUrl);

            try {
                const cached = await this.get(cacheKey);
                if (cached) {
                    res.setHeader('X-Cache', 'HIT');
                    res.setHeader('X-Cache-Key', cacheKey);
                    return res.json(cached);
                }

                // Interceptar la respuesta para cachearla
                const originalSend = res.send;
                res.send = function (body) {
                    if (res.statusCode === 200) {
                        try {
                            const data = JSON.parse(body);
                            cache.set(cacheKey, data, ttlSeconds);
                        } catch (e) {
                            // No es JSON, no cachear
                        }
                    }

                    res.setHeader('X-Cache', 'MISS');
                    res.setHeader('X-Cache-Key', cacheKey);
                    return originalSend.call(this, body);
                };

                next();
            } catch (error) {
                console.error('Cache middleware error:', error);
                next();
            }
        };
    }
}

// Instancia singleton
const cache = new CacheService();

// Funciones de utilidad para cache de datos específicos
export const cacheUtils = {
    // Cache de productos
    products: {
        get: (storeId) => cache.get(cache.generateKey('products', storeId)),
        set: (storeId, products) => cache.set(cache.generateKey('products', storeId), products, 600),
        delete: (storeId) => cache.delete(cache.generateKey('products', storeId))
    },

    // Cache de dashboard
    dashboard: {
        get: (storeId) => cache.get(cache.generateKey('dashboard', storeId)),
        set: (storeId, data) => cache.set(cache.generateKey('dashboard', storeId), data, 300),
        delete: (storeId) => cache.delete(cache.generateKey('dashboard', storeId))
    },

    // Cache de reportes
    reports: {
        get: (storeId, type, params) => cache.get(cache.generateKey('reports', storeId, type, JSON.stringify(params))),
        set: (storeId, type, params, data) => cache.set(cache.generateKey('reports', storeId, type, JSON.stringify(params)), data, 1800),
        delete: (storeId, type) => cache.delete(cache.generateKey('reports', storeId, type, '*'))
    }
};

export { cache };
export default cache;
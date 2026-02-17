import os from 'os';

// Configuración optimizada para producción
export const productionConfig = {
    // Configuración de base de datos
    database: {
        // SQLite optimizado para producción
        sqlite: {
            filename: process.env.DATABASE_PATH || './database.db',
            options: {
                // WAL mode para mejor concurrencia
                pragma: {
                    journal_mode: 'WAL',
                    synchronous: 'NORMAL',
                    cache_size: 1000000,
                    temp_store: 'memory',
                    mmap_size: 268435456, // 256MB
                    foreign_keys: 'ON',
                    auto_vacuum: 'INCREMENTAL'
                }
            }
        },

        // PostgreSQL para alta escala
        postgresql: {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'inventstore',
            username: process.env.DB_USER || 'inventstore',
            password: process.env.DB_PASSWORD,
            ssl: process.env.DB_SSL === 'true',
            pool: {
                min: 2,
                max: 20,
                idle: 10000,
                acquire: 30000,
                evict: 1000
            }
        }
    },

    // Configuración de cache
    cache: {
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            db: process.env.REDIS_DB || 0,
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            enableOfflineQueue: false,
            lazyConnect: true
        },

        // Cache en memoria como fallback
        memory: {
            max: 1000,
            ttl: 300000 // 5 minutos
        }
    },

    // Configuración de seguridad
    security: {
        jwt: {
            secret: process.env.JWT_SECRET,
            expiresIn: '24h',
            algorithm: 'HS256'
        },

        bcrypt: {
            rounds: process.env.NODE_ENV === 'production' ? 12 : 10
        },

        rateLimiting: {
            windowMs: 15 * 60 * 1000, // 15 minutos
            maxRequests: process.env.RATE_LIMIT_MAX || 100,
            skipSuccessfulRequests: false,
            skipFailedRequests: false
        },

        cors: {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true,
            optionsSuccessStatus: 200
        }
    },

    // Configuración de logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: 'json',
        transports: {
            console: {
                enabled: true,
                colorize: process.env.NODE_ENV !== 'production'
            },
            file: {
                enabled: process.env.NODE_ENV === 'production',
                filename: 'logs/app.log',
                maxsize: 5242880, // 5MB
                maxFiles: 5,
                tailable: true
            },
            error: {
                enabled: process.env.NODE_ENV === 'production',
                filename: 'logs/error.log',
                level: 'error',
                maxsize: 5242880,
                maxFiles: 5
            }
        }
    },

    // Configuración de rendimiento
    performance: {
        compression: {
            enabled: true,
            level: 6,
            threshold: 1024
        },

        clustering: {
            enabled: process.env.CLUSTER_MODE === 'true',
            workers: process.env.CLUSTER_WORKERS || os.cpus().length
        },

        keepAlive: {
            enabled: true,
            timeout: 65000
        }
    },

    // Configuración de monitoreo
    monitoring: {
        prometheus: {
            enabled: process.env.PROMETHEUS_ENABLED === 'true',
            endpoint: '/metrics',
            collectDefaultMetrics: true
        },

        healthCheck: {
            endpoint: '/health',
            timeout: 5000
        },

        apm: {
            enabled: process.env.APM_ENABLED === 'true',
            serviceName: 'inventstore-api',
            environment: process.env.NODE_ENV
        }
    },

    // Configuración de backup
    backup: {
        enabled: process.env.BACKUP_ENABLED !== 'false',
        schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // 2 AM diario
        retention: {
            days: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30
        },
        storage: {
            local: {
                path: process.env.BACKUP_PATH || './backups'
            },
            s3: {
                enabled: process.env.S3_BACKUP_ENABLED === 'true',
                bucket: process.env.S3_BACKUP_BUCKET,
                region: process.env.S3_BACKUP_REGION,
                accessKeyId: process.env.S3_ACCESS_KEY_ID,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
            }
        }
    },

    // Configuración de notificaciones
    notifications: {
        email: {
            enabled: process.env.EMAIL_ENABLED === 'true',
            smtp: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            }
        },

        slack: {
            enabled: process.env.SLACK_ENABLED === 'true',
            webhook: process.env.SLACK_WEBHOOK_URL,
            channel: process.env.SLACK_CHANNEL || '#alerts'
        }
    }
};

export default productionConfig;
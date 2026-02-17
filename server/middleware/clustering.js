import cluster from 'cluster';
import os from 'os';
import { logger } from './logger.js';

// Configuración de clustering para producción
export const setupClustering = (workers = os.cpus().length) => {
    if (cluster.isPrimary) {
        logger.info(`🚀 Master process ${process.pid} starting`);
        logger.info(`📊 Starting ${workers} workers`);

        // Crear workers
        for (let i = 0; i < workers; i++) {
            const worker = cluster.fork();
            logger.info(`👷 Worker ${worker.process.pid} started`);
        }

        // Manejar workers que mueren
        cluster.on('exit', (worker, code, signal) => {
            logger.error(`💀 Worker ${worker.process.pid} died (${signal || code})`);

            // Reiniciar worker automáticamente
            if (!worker.exitedAfterDisconnect) {
                logger.info('🔄 Restarting worker...');
                const newWorker = cluster.fork();
                logger.info(`👷 New worker ${newWorker.process.pid} started`);
            }
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('🛑 Master received SIGTERM, shutting down gracefully');

            for (const id in cluster.workers) {
                cluster.workers[id].kill();
            }
        });

        // Estadísticas de workers
        setInterval(() => {
            const workers = Object.keys(cluster.workers).length;
            logger.info(`📊 Active workers: ${workers}`);
        }, 30000); // Cada 30 segundos

        return true; // Es master
    } else {
        // Código del worker
        logger.info(`👷 Worker ${process.pid} started`);

        // Graceful shutdown para workers
        process.on('SIGTERM', () => {
            logger.info(`🛑 Worker ${process.pid} received SIGTERM, shutting down gracefully`);
            process.exit(0);
        });

        return false; // Es worker
    }
};

// Middleware para balanceo de carga entre workers
export const workerLoadBalancer = (req, res, next) => {
    // Agregar información del worker a las respuestas
    res.setHeader('X-Worker-PID', process.pid);
    res.setHeader('X-Worker-Memory', Math.round(process.memoryUsage().heapUsed / 1024 / 1024));

    next();
};

// Función para obtener estadísticas de workers
export const getWorkerStats = () => {
    if (cluster.isPrimary) {
        const stats = {
            master: process.pid,
            workers: [],
            totalWorkers: Object.keys(cluster.workers).length
        };

        for (const id in cluster.workers) {
            const worker = cluster.workers[id];
            stats.workers.push({
                id: parseInt(id),
                pid: worker.process.pid,
                state: worker.state,
                isDead: worker.isDead()
            });
        }

        return stats;
    } else {
        return {
            worker: process.pid,
            memory: process.memoryUsage(),
            uptime: process.uptime()
        };
    }
};

export default {
    setupClustering,
    workerLoadBalancer,
    getWorkerStats
};
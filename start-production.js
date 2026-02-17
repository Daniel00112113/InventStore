#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import os from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🏭 Starting InvenStore in Production Mode...\n');

// Verificar variables de entorno críticas
const requiredEnvVars = ['JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
        console.error(`   - ${varName}`);
    });
    console.error('\nPlease set these variables before starting in production mode.');
    process.exit(1);
}

// Configurar variables de entorno para producción
const productionEnv = {
    ...process.env,
    NODE_ENV: 'production',
    CLUSTER_MODE: 'true',
    PROMETHEUS_ENABLED: 'true',
    BACKUP_ENABLED: 'true',
    LOG_LEVEL: 'info'
};

// Crear directorio de logs si no existe
const logsDir = join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('📁 Created logs directory');
}

// Crear directorio de backups si no existe
const backupsDir = join(__dirname, 'backups');
if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
    console.log('📁 Created backups directory');
}

console.log('🔧 Production Configuration:');
console.log(`   - Clustering: ${productionEnv.CLUSTER_MODE}`);
console.log(`   - Prometheus: ${productionEnv.PROMETHEUS_ENABLED}`);
console.log(`   - Backups: ${productionEnv.BACKUP_ENABLED}`);
console.log(`   - Log Level: ${productionEnv.LOG_LEVEL}`);
console.log(`   - Workers: ${os.cpus().length}`);
console.log('');

// Iniciar el servidor
const serverProcess = spawn('node', ['server/index.js'], {
    env: productionEnv,
    stdio: 'inherit',
    cwd: __dirname
});

// Manejar señales de terminación
process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    serverProcess.kill('SIGINT');
});

serverProcess.on('exit', (code) => {
    console.log(`\n📊 Server process exited with code ${code}`);
    process.exit(code);
});

serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
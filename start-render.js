#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🚀 Starting InvenStore for Render deployment...\n');

// Configurar variables de entorno para Render
const renderEnv = {
    ...process.env,
    NODE_ENV: 'production',
    // Desactivar clustering en Render (solo 1 instancia)
    CLUSTER_MODE: 'false',
    // Activar métricas
    PROMETHEUS_ENABLED: 'true',
    BACKUP_ENABLED: 'true',
    LOG_LEVEL: 'info'
};

// Verificar que JWT_SECRET esté configurado
if (!renderEnv.JWT_SECRET || renderEnv.JWT_SECRET.length < 32) {
    console.log('⚠️  JWT_SECRET not configured, generating one...');
    const crypto = await import('crypto');
    renderEnv.JWT_SECRET = crypto.randomBytes(64).toString('hex');
    console.log('✅ JWT_SECRET generated');
}

console.log('🔧 Render Configuration:');
console.log(`   - Environment: ${renderEnv.NODE_ENV}`);
console.log(`   - Port: ${renderEnv.PORT || 3000}`);
console.log(`   - Clustering: ${renderEnv.CLUSTER_MODE}`);
console.log(`   - Metrics: ${renderEnv.PROMETHEUS_ENABLED}`);
console.log(`   - Backups: ${renderEnv.BACKUP_ENABLED}`);
console.log('');

// Crear directorio de backups si no existe
const backupsDir = join(__dirname, 'backups');
if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
    console.log('📁 Created backups directory');
}

// Iniciar el servidor
const serverProcess = spawn('node', ['server/index.js'], {
    env: renderEnv,
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
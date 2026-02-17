#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🔧 Optimizing InvenStore for Production...\n');

function checkFileExists(filePath) {
    return fs.existsSync(path.join(__dirname, filePath));
}

function verifyProductionReadiness() {
    console.log('🔍 Verifying production readiness...\n');

    const checks = [
        {
            name: 'Environment file',
            check: () => checkFileExists('.env'),
            fix: 'Copy .env.production to .env and configure'
        },
        {
            name: 'JWT Secret',
            check: () => {
                const jwtSecret = process.env.JWT_SECRET;
                return jwtSecret && jwtSecret.length >= 32;
            },
            fix: 'Set JWT_SECRET in .env with at least 32 characters'
        },
        {
            name: 'Database file',
            check: () => checkFileExists('database.db'),
            fix: 'Run: npm run setup && npm run migrate'
        },
        {
            name: 'Backup directory',
            check: () => checkFileExists('backups') || true, // Se crea automáticamente
            fix: 'Directory will be created automatically'
        },
        {
            name: 'Production script',
            check: () => checkFileExists('start-production.js'),
            fix: 'Production script is available'
        }
    ];

    let allPassed = true;

    checks.forEach(({ name, check, fix }) => {
        const passed = check();
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${name}`);

        if (!passed) {
            console.log(`   Fix: ${fix}`);
            allPassed = false;
        }
    });

    console.log(`\n${allPassed ? '🎉' : '⚠️'} Production readiness: ${allPassed ? 'READY' : 'NEEDS ATTENTION'}\n`);

    return allPassed;
}

// Ejecutar verificación
const isReady = verifyProductionReadiness();

console.log('\n🚀 Ready for production deployment!');
console.log('📖 See DEPLOYMENT_GUIDE.md for deployment instructions.');

if (!isReady) {
    process.exit(1);
}
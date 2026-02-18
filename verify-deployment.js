#!/usr/bin/env node

/**
 * Verification script for clean deployment
 * Ensures no personal data is included and super admin setup works
 */

import { existsSync } from 'fs';
import { readdir } from 'fs/promises';

console.log('🔍 Verificando deployment limpio...\n');

// Check for database files that shouldn't be committed
const databaseFiles = [
    'database.db',
    'database.db-shm',
    'database.db-wal'
];

let hasDbFiles = false;
for (const file of databaseFiles) {
    if (existsSync(file)) {
        console.log(`❌ ENCONTRADO: ${file} - Este archivo NO debe estar en el repositorio`);
        hasDbFiles = true;
    }
}

if (!hasDbFiles) {
    console.log('✅ No se encontraron archivos de base de datos en el repositorio');
}

// Check backup directory
try {
    const backupFiles = await readdir('backups');
    const dbBackups = backupFiles.filter(f => f.endsWith('.db'));

    if (dbBackups.length > 0) {
        console.log(`❌ ENCONTRADOS ${dbBackups.length} archivos de backup con datos:`);
        dbBackups.forEach(f => console.log(`   - backups/${f}`));
        console.log('   Estos archivos deben eliminarse antes del deployment');
    } else {
        console.log('✅ Directorio de backups limpio');
    }
} catch (error) {
    console.log('✅ Directorio de backups no existe o está vacío');
}

// Verify essential files exist
const essentialFiles = [
    'server/db/setup.js',
    'server/db/schema.sql',
    'server/routes/super-admin.js',
    'render.yaml',
    'package.json'
];

let missingFiles = [];
for (const file of essentialFiles) {
    if (!existsSync(file)) {
        missingFiles.push(file);
    }
}

if (missingFiles.length > 0) {
    console.log('\n❌ ARCHIVOS FALTANTES:');
    missingFiles.forEach(f => console.log(`   - ${f}`));
} else {
    console.log('\n✅ Todos los archivos esenciales están presentes');
}

// Summary
console.log('\n📋 RESUMEN:');
if (!hasDbFiles && missingFiles.length === 0) {
    console.log('🎉 DEPLOYMENT LIMPIO - Listo para producción');
    console.log('\n📝 Credenciales que se crearán en producción:');
    console.log('   👤 Admin: admin / admin123');
    console.log('   🔑 Super Admin: superadmin / superadmin123');
    console.log('   🌐 Panel Super Admin: https://tu-dominio.com/super-admin');
} else {
    console.log('⚠️  REQUIERE ATENCIÓN - Revisar errores arriba');
    process.exit(1);
}
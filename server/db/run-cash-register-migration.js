import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../database.db');
const migrationPath = join(__dirname, 'migrations/add-cash-register-closings.sql');

console.log('🔄 Ejecutando migración de cierre de caja...');

try {
    const db = new Database(dbPath);
    const migration = fs.readFileSync(migrationPath, 'utf8');

    // Ejecutar migración
    db.exec(migration);

    console.log('✅ Migración completada exitosamente');
    console.log('📋 Tabla cash_register_closings creada');
    console.log('📊 Índices creados');

    db.close();
} catch (error) {
    console.error('❌ Error en migración:', error.message);
    process.exit(1);
}

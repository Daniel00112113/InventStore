#!/usr/bin/env node

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🔄 Ejecutando migración de campos de productos...');

try {
    const db = new Database('database.db');

    // Verificar si los campos ya existen
    const tableInfo = db.prepare("PRAGMA table_info(products)").all();
    const existingColumns = tableInfo.map(col => col.name);

    const requiredColumns = [
        'presentation',
        'unit_type',
        'units_per_pack',
        'pack_price',
        'wholesale_quantity',
        'wholesale_price'
    ];

    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length === 0) {
        console.log('✅ Todos los campos ya existen en la tabla products');
        db.close();
        process.exit(0);
    }

    console.log(`📝 Agregando campos faltantes: ${missingColumns.join(', ')}`);

    // Ejecutar la migración en una transacción
    const migrate = db.transaction(() => {
        // Agregar cada campo faltante individualmente
        missingColumns.forEach(column => {
            try {
                switch (column) {
                    case 'presentation':
                        db.prepare("ALTER TABLE products ADD COLUMN presentation TEXT DEFAULT 'unidad'").run();
                        break;
                    case 'unit_type':
                        db.prepare("ALTER TABLE products ADD COLUMN unit_type TEXT").run();
                        break;
                    case 'units_per_pack':
                        db.prepare("ALTER TABLE products ADD COLUMN units_per_pack INTEGER").run();
                        break;
                    case 'pack_price':
                        db.prepare("ALTER TABLE products ADD COLUMN pack_price REAL").run();
                        break;
                    case 'wholesale_quantity':
                        db.prepare("ALTER TABLE products ADD COLUMN wholesale_quantity INTEGER").run();
                        break;
                    case 'wholesale_price':
                        db.prepare("ALTER TABLE products ADD COLUMN wholesale_price REAL").run();
                        break;
                }
                console.log(`  ✅ Campo '${column}' agregado`);
            } catch (error) {
                if (error.message.includes('duplicate column name')) {
                    console.log(`  ⚠️ Campo '${column}' ya existe`);
                } else {
                    throw error;
                }
            }
        });
    });

    migrate();

    console.log('✅ Migración de campos de productos completada exitosamente');

    // Verificar la estructura final
    const finalTableInfo = db.prepare("PRAGMA table_info(products)").all();
    console.log('📋 Estructura final de la tabla products:');
    finalTableInfo.forEach(col => {
        console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });

    db.close();

} catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
}
import Database from 'better-sqlite3';

const db = new Database('database.db');

console.log('🔄 Iniciando migración a V3 - Funcionalidades Avanzadas...\n');

try {
    // 1. Agregar unidades de medida y precios por cantidad a productos
    console.log('📦 Actualizando tabla de productos...');

    const productColumns = [
        'ALTER TABLE products ADD COLUMN unit_type TEXT DEFAULT "unidad"',
        'ALTER TABLE products ADD COLUMN units_per_pack INTEGER DEFAULT 1',
        'ALTER TABLE products ADD COLUMN pack_price REAL',
        'ALTER TABLE products ADD COLUMN wholesale_quantity INTEGER DEFAULT 12',
        'ALTER TABLE products ADD COLUMN wholesale_price REAL'
    ];

    productColumns.forEach(sql => {
        try {
            db.exec(sql);
        } catch (e) {
            if (!e.message.includes('duplicate column')) {
                throw e;
            }
        }
    });
    console.log('✅ Productos actualizados con unidades de medida');

    // 2. Tabla de historial de precios
    db.exec(`
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            old_cost_price REAL,
            new_cost_price REAL,
            old_sale_price REAL,
            new_sale_price REAL,
            changed_by INTEGER NOT NULL,
            reason TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (changed_by) REFERENCES users(id)
        );
    `);
    console.log('✅ Tabla de historial de precios creada');

    // 3. Tabla de devoluciones
    db.exec(`
        CREATE TABLE IF NOT EXISTS returns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id INTEGER NOT NULL,
            sale_id INTEGER,
            customer_id INTEGER,
            total_amount REAL NOT NULL,
            reason TEXT,
            status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'pending')),
            processed_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
            FOREIGN KEY (sale_id) REFERENCES sales(id),
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (processed_by) REFERENCES users(id)
        );
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS return_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            return_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            subtotal REAL NOT NULL,
            FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );
    `);
    console.log('✅ Tablas de devoluciones creadas');

    // 4. Tabla de alertas de stock
    db.exec(`
        CREATE TABLE IF NOT EXISTS stock_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            alert_type TEXT NOT NULL CHECK(alert_type IN ('low_stock', 'out_of_stock')),
            notified INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
    `);
    console.log('✅ Tabla de alertas de stock creada');

    // 5. Tabla de métodos de pago adicionales
    db.exec(`
        CREATE TABLE IF NOT EXISTS payment_methods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('card', 'transfer', 'digital', 'other')),
            active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
        );
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS sale_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            payment_method_id INTEGER,
            payment_type TEXT NOT NULL,
            amount REAL NOT NULL,
            reference TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
            FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
        );
    `);
    console.log('✅ Tablas de métodos de pago creadas');

    // 6. Tabla de backups automáticos
    db.exec(`
        CREATE TABLE IF NOT EXISTS backups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            size_bytes INTEGER,
            status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'failed')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
        );
    `);
    console.log('✅ Tabla de backups creada');

    // 7. Actualizar promociones para soportar descuentos por cantidad
    const promotionColumns = [
        'ALTER TABLE promotions ADD COLUMN applies_to TEXT DEFAULT "all"',
        'ALTER TABLE promotions ADD COLUMN product_ids TEXT',
        'ALTER TABLE promotions ADD COLUMN category_ids TEXT',
        'ALTER TABLE promotions ADD COLUMN min_quantity INTEGER DEFAULT 1',
        'ALTER TABLE promotions ADD COLUMN max_uses INTEGER',
        'ALTER TABLE promotions ADD COLUMN times_used INTEGER DEFAULT 0'
    ];

    promotionColumns.forEach(sql => {
        try {
            db.exec(sql);
        } catch (e) {
            if (!e.message.includes('duplicate column')) {
                throw e;
            }
        }
    });
    console.log('✅ Promociones actualizadas con descuentos por cantidad');

    // 8. Crear índices para optimización
    const indices = [
        'CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id)',
        'CREATE INDEX IF NOT EXISTS idx_returns_store ON returns(store_id)',
        'CREATE INDEX IF NOT EXISTS idx_returns_sale ON returns(sale_id)',
        'CREATE INDEX IF NOT EXISTS idx_stock_alerts_store ON stock_alerts(store_id)',
        'CREATE INDEX IF NOT EXISTS idx_stock_alerts_product ON stock_alerts(product_id)',
        'CREATE INDEX IF NOT EXISTS idx_payment_methods_store ON payment_methods(store_id)',
        'CREATE INDEX IF NOT EXISTS idx_sale_payments_sale ON sale_payments(sale_id)',
        'CREATE INDEX IF NOT EXISTS idx_backups_store ON backups(store_id)'
    ];

    indices.forEach(sql => db.exec(sql));
    console.log('✅ Índices creados');

    // 9. Insertar métodos de pago por defecto
    const stores = db.prepare('SELECT id FROM stores').all();
    const insertPaymentMethod = db.prepare(`
        INSERT OR IGNORE INTO payment_methods (store_id, name, type)
        VALUES (?, ?, ?)
    `);

    stores.forEach(store => {
        insertPaymentMethod.run(store.id, 'Tarjeta Débito', 'card');
        insertPaymentMethod.run(store.id, 'Tarjeta Crédito', 'card');
        insertPaymentMethod.run(store.id, 'Transferencia', 'transfer');
        insertPaymentMethod.run(store.id, 'Nequi', 'digital');
        insertPaymentMethod.run(store.id, 'Daviplata', 'digital');
    });
    console.log('✅ Métodos de pago por defecto creados');

    console.log('\n🎉 Migración V3 completada exitosamente!\n');
    console.log('Nuevas características disponibles:');
    console.log('  ✅ Precios por cantidad (unidad/paca/mayoreo)');
    console.log('  ✅ Historial de cambios de precios');
    console.log('  ✅ Sistema de devoluciones');
    console.log('  ✅ Alertas de stock bajo');
    console.log('  ✅ Múltiples métodos de pago');
    console.log('  ✅ Descuentos por cantidad en promociones');
    console.log('  ✅ Sistema de backups automáticos');

} catch (error) {
    console.error('❌ Error en migración:', error.message);
    process.exit(1);
} finally {
    db.close();
}

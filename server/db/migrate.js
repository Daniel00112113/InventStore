import Database from 'better-sqlite3';

const db = new Database('database.db');

console.log('🔄 Iniciando migración a V2...');

try {
    // Crear tabla de categorías
    db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );
  `);
    console.log('✅ Tabla categories creada');

    // Crear tabla de promociones
    db.exec(`
    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('percentage', 'fixed')),
      value REAL NOT NULL,
      min_purchase REAL DEFAULT 0,
      active INTEGER DEFAULT 1,
      start_date DATETIME,
      end_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );
  `);
    console.log('✅ Tabla promotions creada');

    // Crear tabla de configuración de tienda
    db.exec(`
    CREATE TABLE IF NOT EXISTS store_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL UNIQUE,
      whatsapp_number TEXT,
      email TEXT,
      smtp_host TEXT,
      smtp_port INTEGER,
      smtp_user TEXT,
      smtp_pass TEXT,
      print_ticket INTEGER DEFAULT 1,
      ticket_header TEXT,
      ticket_footer TEXT DEFAULT '¡Gracias por su compra!',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
    );
  `);
    console.log('✅ Tabla store_settings creada');

    // Agregar campo category_id a products (si no existe)
    try {
        db.exec(`ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;`);
        console.log('✅ Campo category_id agregado a products');
    } catch (e) {
        if (e.message.includes('duplicate column')) {
            console.log('⚠️  Campo category_id ya existe en products');
        } else {
            throw e;
        }
    }

    // Crear tabla temporal para sales con nuevos campos
    db.exec(`
    CREATE TABLE IF NOT EXISTS sales_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      customer_id INTEGER,
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_type TEXT NOT NULL CHECK(payment_type IN ('efectivo', 'fiado', 'mixto')),
      cash_amount REAL DEFAULT 0,
      credit_amount REAL DEFAULT 0,
      promotion_id INTEGER,
      status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'pending')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL
    );
  `);

    // Copiar datos existentes
    const salesExist = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sales'").get();

    if (salesExist) {
        db.exec(`
      INSERT INTO sales_new (id, store_id, user_id, customer_id, subtotal, total, payment_type, status, created_at)
      SELECT id, store_id, user_id, customer_id, total as subtotal, total, payment_type, status, created_at
      FROM sales;
    `);
        console.log('✅ Datos de sales migrados');

        // Eliminar tabla vieja y renombrar
        db.exec(`DROP TABLE sales;`);
        db.exec(`ALTER TABLE sales_new RENAME TO sales;`);
        console.log('✅ Tabla sales actualizada');
    } else {
        db.exec(`ALTER TABLE sales_new RENAME TO sales;`);
        console.log('✅ Tabla sales creada');
    }

    // Crear índices
    db.exec(`CREATE INDEX IF NOT EXISTS idx_categories_store ON categories(store_id);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_promotions_store ON promotions(store_id);`);
    console.log('✅ Índices creados');

    // Crear categoría por defecto para cada tienda
    const stores = db.prepare('SELECT id FROM stores').all();
    const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (store_id, name, description) VALUES (?, ?, ?)');

    stores.forEach(store => {
        insertCategory.run(store.id, 'General', 'Categoría por defecto');
    });
    console.log('✅ Categorías por defecto creadas');

    // Crear configuración por defecto para cada tienda
    const insertSettings = db.prepare('INSERT OR IGNORE INTO store_settings (store_id) VALUES (?)');

    stores.forEach(store => {
        insertSettings.run(store.id);
    });
    console.log('✅ Configuración por defecto creada');

    console.log('\n🎉 Migración completada exitosamente!');
    console.log('\nNuevas características disponibles:');
    console.log('  ✅ Categorías de productos');
    console.log('  ✅ Descuentos y promociones');
    console.log('  ✅ Pago mixto (efectivo + fiado)');
    console.log('  ✅ Exportar reportes (PDF/Excel)');
    console.log('  ✅ Imprimir tickets');
    console.log('  ✅ Notificaciones WhatsApp/Email');

} catch (error) {
    console.error('❌ Error en migración:', error.message);
    process.exit(1);
} finally {
    db.close();
}

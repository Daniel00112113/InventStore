import Database from 'better-sqlite3';

const db = new Database('database.db');

console.log('🔧 Optimizando base de datos...\n');

try {
    // Analizar y optimizar tablas
    console.log('📊 Analizando tablas...');
    db.exec('ANALYZE');
    console.log('✅ Análisis completado');

    // Vacuum para compactar la base de datos
    console.log('\n🗜️  Compactando base de datos...');
    db.exec('VACUUM');
    console.log('✅ Base de datos compactada');

    // Crear índices adicionales si no existen
    console.log('\n📑 Verificando índices...');

    const indices = [
        'CREATE INDEX IF NOT EXISTS idx_customers_balance ON customers(store_id, balance)',
        'CREATE INDEX IF NOT EXISTS idx_products_stock ON products(store_id, stock, min_stock)',
        'CREATE INDEX IF NOT EXISTS idx_products_active ON products(store_id, active)',
        'CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id)',
        'CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id)',
        'CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id)',
        'CREATE INDEX IF NOT EXISTS idx_categories_store ON categories(store_id)',
        'CREATE INDEX IF NOT EXISTS idx_promotions_store ON promotions(store_id)',
        'CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(store_id, active)'
    ];

    indices.forEach(sql => {
        db.exec(sql);
    });

    console.log('✅ Índices verificados y creados');

    // Estadísticas de la base de datos
    console.log('\n📈 Estadísticas:');

    const stats = db.prepare(`
        SELECT 
            (SELECT COUNT(*) FROM stores) as stores,
            (SELECT COUNT(*) FROM users) as users,
            (SELECT COUNT(*) FROM products) as products,
            (SELECT COUNT(*) FROM sales) as sales,
            (SELECT COUNT(*) FROM customers) as customers,
            (SELECT COUNT(*) FROM categories) as categories
    `).get();

    console.log(`   Tiendas: ${stats.stores}`);
    console.log(`   Usuarios: ${stats.users}`);
    console.log(`   Productos: ${stats.products}`);
    console.log(`   Ventas: ${stats.sales}`);
    console.log(`   Clientes: ${stats.customers}`);
    console.log(`   Categorías: ${stats.categories}`);

    // Tamaño de la base de datos
    const fs = await import('fs');
    const dbStats = fs.statSync('database.db');
    const sizeMB = (dbStats.size / (1024 * 1024)).toFixed(2);
    console.log(`\n💾 Tamaño de BD: ${sizeMB} MB`);

    console.log('\n🎉 Optimización completada exitosamente!');
    console.log('\n💡 Recomendaciones:');
    console.log('   - Ejecuta este script mensualmente');
    console.log('   - Haz backups antes de optimizar');
    console.log('   - Monitorea el rendimiento de consultas');

} catch (error) {
    console.error('❌ Error en optimización:', error.message);
    process.exit(1);
} finally {
    db.close();
}

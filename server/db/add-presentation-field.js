import Database from 'better-sqlite3';

const db = new Database('database.db');

console.log('🔄 Agregando campo presentation a productos...');

try {
    // Verificar si la columna ya existe
    const tableInfo = db.prepare("PRAGMA table_info(products)").all();
    const hasPresentation = tableInfo.some(col => col.name === 'presentation');

    if (hasPresentation) {
        console.log('⚠️  El campo "presentation" ya existe en la tabla products');
    } else {
        // Agregar la columna
        db.exec("ALTER TABLE products ADD COLUMN presentation TEXT DEFAULT 'unidad'");
        console.log('✅ Campo "presentation" agregado exitosamente');
    }

    // Crear índice
    try {
        db.exec("CREATE INDEX IF NOT EXISTS idx_products_presentation ON products(store_id, presentation)");
        console.log('✅ Índice creado exitosamente');
    } catch (e) {
        console.log('ℹ️  Índice ya existe');
    }

    console.log('\n📦 Migración completada. Ahora puedes usar presentaciones en tus productos.');

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
} finally {
    db.close();
}

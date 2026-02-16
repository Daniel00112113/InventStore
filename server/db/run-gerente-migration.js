import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, '../../database.db'));

console.log('🔄 Ejecutando migración para agregar rol gerente...');

try {
    // Verificar si la migración ya se ejecutó
    try {
        const testQuery = db.prepare("SELECT role FROM users WHERE role = 'gerente' LIMIT 1");
        testQuery.get();
        console.log('✅ La migración ya fue ejecutada anteriormente');
        process.exit(0);
    } catch (error) {
        // Si falla, necesitamos ejecutar la migración
        console.log('📝 Ejecutando migración...');
    }

    // Ejecutar la migración en una transacción
    const migrate = db.transaction(() => {
        // Crear tabla temporal con el nuevo constraint
        db.prepare(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'gerente', 'empleado')),
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        UNIQUE(store_id, username)
      )
    `).run();

        // Copiar datos existentes
        db.prepare('INSERT INTO users_new SELECT * FROM users').run();

        // Eliminar tabla antigua
        db.prepare('DROP TABLE users').run();

        // Renombrar tabla nueva
        db.prepare('ALTER TABLE users_new RENAME TO users').run();
    });

    migrate();

    console.log('✅ Migración completada exitosamente');
    console.log('📝 Ahora puedes crear usuarios con rol "gerente"');

} catch (error) {
    console.error('❌ Error en la migración:', error.message);
    process.exit(1);
} finally {
    db.close();
}

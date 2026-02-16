import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, '../../database.db'));

console.log('🔄 Forzando migración para agregar rol gerente...');

try {
    console.log('0️⃣ Deshabilitando foreign keys...');
    db.pragma('foreign_keys = OFF');

    console.log('1️⃣ Creando tabla temporal...');
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

    console.log('2️⃣ Copiando datos existentes...');
    db.prepare('INSERT INTO users_new SELECT * FROM users').run();

    console.log('3️⃣ Eliminando tabla antigua...');
    db.prepare('DROP TABLE users').run();

    console.log('4️⃣ Renombrando tabla nueva...');
    db.prepare('ALTER TABLE users_new RENAME TO users').run();

    console.log('5️⃣ Habilitando foreign keys...');
    db.pragma('foreign_keys = ON');

    console.log('✅ Migración completada exitosamente');
    console.log('📝 Verificando...');

    // Verificar que funcionó
    const test = db.prepare("SELECT COUNT(*) as count FROM users").get();
    console.log(`✓ ${test.count} usuarios migrados correctamente`);

} catch (error) {
    console.error('❌ Error en la migración:', error.message);
    console.error(error);
    process.exit(1);
} finally {
    db.close();
}

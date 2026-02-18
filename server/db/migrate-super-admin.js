import Database from 'better-sqlite3';

const db = new Database('database.db');

console.log('🔄 Migrando schema para super admin...');

try {
    // Crear tabla temporal con el nuevo schema
    db.exec(`
        CREATE TABLE users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            store_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'gerente', 'empleado', 'super_admin')),
            active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
            UNIQUE(store_id, username)
        );
    `);

    // Copiar datos existentes
    db.exec(`
        INSERT INTO users_new (id, store_id, username, password_hash, full_name, role, active, created_at)
        SELECT id, store_id, username, password_hash, full_name, role, active, created_at
        FROM users;
    `);

    // Eliminar tabla vieja y renombrar la nueva
    db.exec('DROP TABLE users;');
    db.exec('ALTER TABLE users_new RENAME TO users;');

    // Recrear índices
    db.exec('CREATE INDEX IF NOT EXISTS idx_users_store ON users(store_id);');

    // Actualizar el usuario superadmin para que tenga el rol correcto
    const updateStmt = db.prepare("UPDATE users SET role = 'super_admin' WHERE username = 'superadmin'");
    const result = updateStmt.run();

    console.log('✅ Migración completada exitosamente');
    console.log(`📝 Usuarios actualizados: ${result.changes}`);

} catch (error) {
    console.error('❌ Error en migración:', error.message);
    process.exit(1);
}

db.close();
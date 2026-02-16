-- Migración para agregar el rol 'gerente'
-- Este rol tiene permisos similares al admin pero no puede crear usuarios

-- Primero, necesitamos recrear la tabla con el nuevo constraint
-- SQLite no permite modificar constraints directamente

-- 1. Crear tabla temporal con el nuevo constraint
CREATE TABLE IF NOT EXISTS users_new (
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
);

-- 2. Copiar datos existentes
INSERT INTO users_new SELECT * FROM users;

-- 3. Eliminar tabla antigua
DROP TABLE users;

-- 4. Renombrar tabla nueva
ALTER TABLE users_new RENAME TO users;

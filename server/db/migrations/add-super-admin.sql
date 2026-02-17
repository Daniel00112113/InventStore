-- Tabla de super administradores globales
CREATE TABLE IF NOT EXISTS super_admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Agregar campo para identificar el tipo de usuario
ALTER TABLE users ADD COLUMN user_type TEXT DEFAULT 'store_admin' CHECK(user_type IN ('store_admin', 'gerente', 'empleado'));

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_super_admins_username ON super_admins(username);
CREATE INDEX IF NOT EXISTS idx_super_admins_active ON super_admins(active);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
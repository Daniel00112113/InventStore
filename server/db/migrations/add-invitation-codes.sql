-- Tabla de códigos de invitación
CREATE TABLE IF NOT EXISTS invitation_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  store_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_phone TEXT,
  owner_address TEXT,
  used INTEGER DEFAULT 0,
  used_at DATETIME,
  store_id INTEGER,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_used ON invitation_codes(used);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_expires ON invitation_codes(expires_at);
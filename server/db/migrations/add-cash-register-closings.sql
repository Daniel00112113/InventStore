-- Migración: Agregar tabla de cierres de caja
-- Fecha: 2026-02-14

-- Tabla de cierres de caja diarios
CREATE TABLE IF NOT EXISTS cash_register_closings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  closing_date DATE NOT NULL,
  expected_cash REAL NOT NULL,
  actual_cash REAL NOT NULL,
  difference REAL NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(store_id, closing_date)
);

-- Índice para optimizar consultas por tienda y fecha
CREATE INDEX IF NOT EXISTS idx_closings_store_date 
  ON cash_register_closings(store_id, closing_date DESC);

-- Índice para consultas por usuario
CREATE INDEX IF NOT EXISTS idx_closings_user 
  ON cash_register_closings(user_id);

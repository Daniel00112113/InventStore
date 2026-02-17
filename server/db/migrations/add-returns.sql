-- Migración: Agregar tablas de devoluciones
-- Fecha: 2026-02-17

-- Tabla de devoluciones
CREATE TABLE IF NOT EXISTS returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL,
  sale_id INTEGER,
  customer_id INTEGER,
  total_amount REAL NOT NULL,
  reason TEXT,
  processed_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- Tabla de items de devolución
CREATE TABLE IF NOT EXISTS return_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_returns_store 
  ON returns(store_id);

CREATE INDEX IF NOT EXISTS idx_returns_date 
  ON returns(store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_returns_sale 
  ON returns(sale_id);

CREATE INDEX IF NOT EXISTS idx_returns_customer 
  ON returns(customer_id);

CREATE INDEX IF NOT EXISTS idx_return_items_return 
  ON return_items(return_id);

CREATE INDEX IF NOT EXISTS idx_return_items_product 
  ON return_items(product_id);
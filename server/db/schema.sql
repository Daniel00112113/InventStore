-- Tabla de tiendas (tenants)
CREATE TABLE IF NOT EXISTS stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  subscription_status TEXT DEFAULT 'active' CHECK(subscription_status IN ('active', 'inactive', 'suspended')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
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

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  balance REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL,
  category_id INTEGER,
  name TEXT NOT NULL,
  barcode TEXT,
  cost_price REAL NOT NULL,
  sale_price REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Tabla de descuentos/promociones
CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('percentage', 'fixed')),
  value REAL NOT NULL,
  min_purchase REAL DEFAULT 0,
  active INTEGER DEFAULT 1,
  start_date DATETIME,
  end_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  customer_id INTEGER,
  subtotal REAL NOT NULL,
  discount REAL DEFAULT 0,
  total REAL NOT NULL,
  payment_type TEXT NOT NULL CHECK(payment_type IN ('efectivo', 'fiado', 'mixto')),
  cash_amount REAL DEFAULT 0,
  credit_amount REAL DEFAULT 0,
  promotion_id INTEGER,
  status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'pending')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL
);

-- Tabla de items de venta
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Tabla de pagos de fiado
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Índices para optimización multi-tenant
CREATE INDEX IF NOT EXISTS idx_users_store ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_customers_store ON customers(store_id);
CREATE INDEX IF NOT EXISTS idx_customers_balance ON customers(store_id, balance);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(store_id, barcode);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(store_id, stock, min_stock);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(store_id, active);
CREATE INDEX IF NOT EXISTS idx_sales_store ON sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_store ON payments(store_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_categories_store ON categories(store_id);
CREATE INDEX IF NOT EXISTS idx_promotions_store ON promotions(store_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(store_id, active);

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcrypt';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database('database.db');

// Leer y ejecutar schema
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// Crear tienda demo
const storeStmt = db.prepare('INSERT INTO stores (name, owner_name, phone, address) VALUES (?, ?, ?, ?)');
const storeResult = storeStmt.run('Tienda Demo', 'Administrador', '3001234567', 'Dirección de ejemplo');
const storeId = storeResult.lastInsertRowid;

// Crear usuario admin
const passwordHash = bcrypt.hashSync('admin123', 10);
const userStmt = db.prepare('INSERT INTO users (store_id, username, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)');
userStmt.run(storeId, 'admin', passwordHash, 'Administrador', 'admin');

// Crear categorías básicas
const categoryStmt = db.prepare('INSERT INTO categories (store_id, name, description) VALUES (?, ?, ?)');
categoryStmt.run(storeId, 'Bebidas', 'Bebidas y refrescos');
categoryStmt.run(storeId, 'Alimentos', 'Productos alimenticios');
categoryStmt.run(storeId, 'Limpieza', 'Productos de limpieza');

// Crear productos demo (sin datos personales)
const productStmt = db.prepare('INSERT INTO products (store_id, name, barcode, cost_price, sale_price, stock, min_stock, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
productStmt.run(storeId, 'Coca Cola 400ml', '7702010000010', 1500, 2000, 50, 10, 1);
productStmt.run(storeId, 'Pan Tajado', '7702010000027', 2500, 3500, 30, 5, 2);
productStmt.run(storeId, 'Arroz 500g', '7702010000034', 1800, 2500, 100, 20, 2);

console.log('✅ Base de datos configurada exitosamente');
console.log(`📦 Tienda ID: ${storeId}`);
console.log('👤 Usuario: admin / Contraseña: admin123');

db.close();

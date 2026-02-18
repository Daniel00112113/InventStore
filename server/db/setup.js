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

// Crear tienda base para super admin
const storeStmt = db.prepare('INSERT INTO stores (name, owner_name, phone, address) VALUES (?, ?, ?, ?)');
const storeResult = storeStmt.run('InvenStore System', 'Sistema', '', '');
const storeId = storeResult.lastInsertRowid;

// Crear usuario admin básico
const passwordHash = bcrypt.hashSync('admin123', 10);
const userStmt = db.prepare('INSERT INTO users (store_id, username, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)');
userStmt.run(storeId, 'admin', passwordHash, 'Administrador', 'admin');

// Crear SUPER ADMIN con rol correcto
const superAdminPasswordHash = bcrypt.hashSync('superadmin123', 10);
const superAdminStmt = db.prepare('INSERT INTO users (store_id, username, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)');
superAdminStmt.run(storeId, 'superadmin', superAdminPasswordHash, 'Super Administrador', 'super_admin');

console.log('✅ Base de datos configurada exitosamente');
console.log(`📦 Tienda Sistema ID: ${storeId}`);
console.log('👤 Usuario admin: admin / admin123');
console.log('🔑 Super Admin: superadmin / superadmin123');
console.log('🌐 Super Admin Panel: /super-admin');
console.log('📝 Nota: Sistema limpio sin datos demo');

db.close();
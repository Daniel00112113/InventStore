import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('database.db');

async function createSuperAdmin() {
    try {
        console.log('🚀 Creando sistema de Super Administrador...');

        // Ejecutar migración
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'migrations', 'add-super-admin.sql'),
            'utf8'
        );

        db.exec(migrationSQL);
        console.log('✅ Migración de Super Admin completada');

        // Verificar si ya existe un super admin
        const existingSuperAdmin = db.prepare('SELECT id FROM super_admins WHERE username = ?').get('superadmin');

        if (existingSuperAdmin) {
            console.log('ℹ️  Super Admin ya existe');
            return;
        }

        // Crear super admin por defecto
        const defaultPassword = 'SuperAdmin123!';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        const result = db.prepare(`
      INSERT INTO super_admins (username, password_hash, full_name, email)
      VALUES (?, ?, ?, ?)
    `).run('superadmin', passwordHash, 'Super Administrador', 'admin@inventstore.com');

        console.log('✅ Super Administrador creado exitosamente');
        console.log('');
        console.log('🔐 CREDENCIALES DE SUPER ADMIN:');
        console.log('   👤 Usuario: superadmin');
        console.log('   🔑 Contraseña: SuperAdmin123!');
        console.log('   🌐 URL: http://localhost:3000/super-admin.html');
        console.log('');
        console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');

    } catch (error) {
        console.error('❌ Error creando Super Admin:', error);
        process.exit(1);
    } finally {
        db.close();
    }
}

createSuperAdmin();
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('database.db');

try {
    console.log('🚀 Ejecutando migración de códigos de invitación...');

    // Leer y ejecutar la migración
    const migrationSQL = fs.readFileSync(
        path.join(__dirname, 'migrations', 'add-invitation-codes.sql'),
        'utf8'
    );

    db.exec(migrationSQL);

    console.log('✅ Migración de códigos de invitación completada');

    // Generar algunos códigos de ejemplo
    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const insertCode = db.prepare(`
    INSERT INTO invitation_codes (code, store_name, owner_name, owner_phone, expires_at)
    VALUES (?, ?, ?, ?, datetime('now', '+30 days'))
  `);

    // Crear códigos de ejemplo
    const exampleCodes = [
        { code: generateCode(), store_name: 'Tienda Demo 1', owner_name: 'Usuario Demo 1', phone: '+57 300 123 4567' },
        { code: generateCode(), store_name: 'Tienda Demo 2', owner_name: 'Usuario Demo 2', phone: '+57 300 234 5678' },
        { code: generateCode(), store_name: 'Mi Tienda', owner_name: 'Propietario', phone: '+57 300 345 6789' }
    ];

    console.log('📝 Generando códigos de invitación de ejemplo...');

    exampleCodes.forEach(({ code, store_name, owner_name, phone }) => {
        insertCode.run(code, store_name, owner_name, phone);
        console.log(`   ✨ Código generado: ${code} para "${store_name}"`);
    });

    console.log('\n🎉 ¡Migración completada exitosamente!');
    console.log('\n📋 Códigos de invitación disponibles:');

    const codes = db.prepare('SELECT code, store_name, owner_name FROM invitation_codes WHERE used = 0').all();
    codes.forEach(({ code, store_name, owner_name }) => {
        console.log(`   🎫 ${code} - ${store_name} (${owner_name})`);
    });

} catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
} finally {
    db.close();
}
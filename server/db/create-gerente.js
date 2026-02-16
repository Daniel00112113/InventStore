import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, '../../database.db'));

console.log('👤 Creando usuario gerente...');

try {
    // Obtener la primera tienda (asumiendo que es la tuya)
    const store = db.prepare('SELECT id, name FROM stores LIMIT 1').get();

    if (!store) {
        console.error('❌ No se encontró ninguna tienda. Ejecuta npm run db:setup primero.');
        process.exit(1);
    }

    console.log(`📍 Tienda: ${store.name} (ID: ${store.id})`);

    // Verificar si ya existe un gerente
    const existingGerente = db.prepare(
        "SELECT username FROM users WHERE store_id = ? AND username = 'gerente'"
    ).get(store.id);

    if (existingGerente) {
        console.log('⚠️  Ya existe un usuario "gerente"');
        console.log('💡 Puedes usar estas credenciales:');
        console.log('   Usuario: gerente');
        console.log('   Contraseña: gerente123');
        process.exit(0);
    }

    // Crear el usuario gerente
    const username = 'gerente';
    const password = 'gerente123';
    const fullName = 'Gerente Principal';
    const passwordHash = bcrypt.hashSync(password, 10);

    const result = db.prepare(`
    INSERT INTO users (store_id, username, password_hash, full_name, role)
    VALUES (?, ?, ?, ?, 'gerente')
  `).run(store.id, username, passwordHash, fullName);

    console.log('✅ Usuario gerente creado exitosamente!');
    console.log('');
    console.log('📋 Credenciales:');
    console.log(`   Usuario: ${username}`);
    console.log(`   Contraseña: ${password}`);
    console.log('');
    console.log('🔐 Permisos del gerente:');
    console.log('   ✓ Gestionar productos, ventas, clientes');
    console.log('   ✓ Ver reportes y estadísticas');
    console.log('   ✓ Crear y editar empleados');
    console.log('   ✗ NO puede crear otros gerentes o admins');
    console.log('   ✗ NO puede eliminar usuarios');
    console.log('');
    console.log('💡 Cambia la contraseña después del primer login');

} catch (error) {
    console.error('❌ Error al crear gerente:', error.message);
    process.exit(1);
} finally {
    db.close();
}

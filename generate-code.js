import Database from 'better-sqlite3';

const db = new Database('database.db');

// Generar código único
function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

try {
    let code;
    let attempts = 0;

    // Asegurar que el código sea único
    do {
        code = generateCode();
        attempts++;
        if (attempts > 10) {
            throw new Error('No se pudo generar un código único');
        }
    } while (db.prepare('SELECT id FROM invitation_codes WHERE code = ?').get(code));

    // Insertar código
    const result = db.prepare(`
    INSERT INTO invitation_codes (code, store_name, owner_name, owner_phone, expires_at)
    VALUES (?, ?, ?, ?, datetime('now', '+30 days'))
  `).run(code, 'Tienda de Prueba', 'Daniel Admin', '+57 300 999 8888');

    console.log(`✨ Código generado: ${code} para "Tienda de Prueba"`);

    // Listar todos los códigos disponibles
    const codes = db.prepare(`
    SELECT code, store_name, owner_name 
    FROM invitation_codes 
    WHERE used = 0 
    ORDER BY created_at DESC
  `).all();

    console.log('\n📋 Códigos disponibles:');
    codes.forEach(({ code, store_name, owner_name }) => {
        console.log(`   🎫 ${code} - ${store_name} (${owner_name})`);
    });

} catch (error) {
    console.error('❌ Error:', error.message);
} finally {
    db.close();
}
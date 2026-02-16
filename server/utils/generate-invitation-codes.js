import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database('database.db');

function generateInvitationCode(storeName, ownerName, ownerPhone = null, ownerAddress = null, expiresInDays = 30) {
    try {
        // Generar código único
        const generateCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 8; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

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
      INSERT INTO invitation_codes (code, store_name, owner_name, owner_phone, owner_address, expires_at)
      VALUES (?, ?, ?, ?, ?, datetime('now', '+${expiresInDays} days'))
    `).run(code, storeName, ownerName, ownerPhone, ownerAddress);

        console.log(`✨ Código generado: ${code} para "${storeName}" (${ownerName})`);
        console.log(`   📅 Expira en ${expiresInDays} días`);

        return {
            code,
            storeName,
            ownerName,
            expiresInDays
        };

    } catch (error) {
        console.error('❌ Error generando código:', error.message);
        throw error;
    }
}

function listAvailableCodes() {
    try {
        const codes = db.prepare(`
      SELECT code, store_name, owner_name, expires_at, created_at 
      FROM invitation_codes 
      WHERE used = 0 AND (expires_at IS NULL OR expires_at > datetime('now'))
      ORDER BY created_at DESC
    `).all();

        console.log('\n📋 Códigos de invitación disponibles:');

        if (codes.length === 0) {
            console.log('   ⚠️  No hay códigos disponibles');
            return;
        }

        codes.forEach(({ code, store_name, owner_name, expires_at }) => {
            const expiresDate = new Date(expires_at).toLocaleDateString('es-CO');
            console.log(`   🎫 ${code} - ${store_name} (${owner_name}) - Expira: ${expiresDate}`);
        });

        return codes;
    } catch (error) {
        console.error('❌ Error listando códigos:', error.message);
        throw error;
    }
}

function listUsedCodes() {
    try {
        const codes = db.prepare(`
      SELECT ic.code, ic.store_name, ic.owner_name, ic.used_at, s.name as actual_store_name
      FROM invitation_codes ic
      LEFT JOIN stores s ON ic.store_id = s.id
      WHERE ic.used = 1
      ORDER BY ic.used_at DESC
    `).all();

        console.log('\n📋 Códigos de invitación usados:');

        if (codes.length === 0) {
            console.log('   ℹ️  No hay códigos usados');
            return;
        }

        codes.forEach(({ code, store_name, owner_name, used_at, actual_store_name }) => {
            const usedDate = new Date(used_at).toLocaleDateString('es-CO');
            console.log(`   ✅ ${code} - ${store_name} (${owner_name}) - Usado: ${usedDate} - Tienda: ${actual_store_name}`);
        });

        return codes;
    } catch (error) {
        console.error('❌ Error listando códigos usados:', error.message);
        throw error;
    }
}

// Función principal para uso desde línea de comandos
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
🎫 Generador de Códigos de Invitación - InvenStore

Uso:
  node generate-invitation-codes.js generate "Nombre Tienda" "Nombre Propietario" [teléfono] [dirección] [días]
  node generate-invitation-codes.js list
  node generate-invitation-codes.js used

Ejemplos:
  node generate-invitation-codes.js generate "Mi Tienda" "Juan Pérez"
  node generate-invitation-codes.js generate "Supermercado Central" "María García" "+57 300 123 4567" "Calle 123 #45-67" 60
  node generate-invitation-codes.js list
  node generate-invitation-codes.js used
    `);
        return;
    }

    const command = args[0];

    try {
        switch (command) {
            case 'generate':
                if (args.length < 3) {
                    console.error('❌ Error: Se requiere nombre de tienda y propietario');
                    console.log('Uso: node generate-invitation-codes.js generate "Nombre Tienda" "Nombre Propietario"');
                    return;
                }

                const storeName = args[1];
                const ownerName = args[2];
                const ownerPhone = args[3] || null;
                const ownerAddress = args[4] || null;
                const expiresInDays = parseInt(args[5]) || 30;

                generateInvitationCode(storeName, ownerName, ownerPhone, ownerAddress, expiresInDays);
                break;

            case 'list':
                listAvailableCodes();
                break;

            case 'used':
                listUsedCodes();
                break;

            default:
                console.error(`❌ Comando desconocido: ${command}`);
                console.log('Comandos disponibles: generate, list, used');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        db.close();
    }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { generateInvitationCode, listAvailableCodes, listUsedCodes };
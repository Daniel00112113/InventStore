import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('database.db');

// Crear directorio de backups si no existe
const backupDir = path.join(__dirname, '../../backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

export async function createBackup(storeId = null) {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_${timestamp}.db`;
        const backupPath = path.join(backupDir, filename);

        // Copiar base de datos
        const sourceDb = fs.readFileSync('database.db');
        fs.writeFileSync(backupPath, sourceDb);

        const stats = fs.statSync(backupPath);

        // Registrar backup
        if (storeId) {
            db.prepare(`
                INSERT INTO backups (store_id, filename, size_bytes, status)
                VALUES (?, ?, ?, 'completed')
            `).run(storeId, filename, stats.size);
        }

        console.log(`✅ Backup creado: ${filename} (${(stats.size / 1024).toFixed(2)} KB)`);

        // Limpiar backups antiguos (mantener últimos 30)
        cleanOldBackups();

        return { success: true, filename, size: stats.size };
    } catch (error) {
        console.error('❌ Error creando backup:', error.message);

        if (storeId) {
            db.prepare(`
                INSERT INTO backups (store_id, filename, size_bytes, status)
                VALUES (?, ?, 0, 'failed')
            `).run(storeId, `failed_${Date.now()}.db`);
        }

        return { success: false, error: error.message };
    }
}

function cleanOldBackups() {
    try {
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
            .map(f => ({
                name: f,
                path: path.join(backupDir, f),
                time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        // Mantener solo los últimos 30 backups
        if (files.length > 30) {
            files.slice(30).forEach(file => {
                fs.unlinkSync(file.path);
                console.log(`🗑️  Backup antiguo eliminado: ${file.name}`);
            });
        }
    } catch (error) {
        console.error('Error limpiando backups:', error.message);
    }
}

export function scheduleAutoBackup() {
    // Backup diario a las 2 AM
    const now = new Date();
    const scheduledTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        2, 0, 0
    );

    const timeUntilBackup = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
        createBackup();
        // Programar siguiente backup
        setInterval(() => createBackup(), 24 * 60 * 60 * 1000);
    }, timeUntilBackup);

    console.log(`📅 Backup automático programado para: ${scheduledTime.toLocaleString()}`);
}

export function listBackups(storeId) {
    return db.prepare(`
        SELECT * FROM backups
        WHERE store_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    `).all(storeId);
}

export function restoreBackup(filename) {
    try {
        const backupPath = path.join(backupDir, filename);

        if (!fs.existsSync(backupPath)) {
            throw new Error('Backup no encontrado');
        }

        // Crear backup de seguridad antes de restaurar
        const safetyBackup = `safety_${Date.now()}.db`;
        fs.copyFileSync('database.db', path.join(backupDir, safetyBackup));

        // Restaurar backup
        const backupData = fs.readFileSync(backupPath);
        fs.writeFileSync('database.db', backupData);

        console.log(`✅ Backup restaurado: ${filename}`);
        console.log(`💾 Backup de seguridad creado: ${safetyBackup}`);

        return { success: true, message: 'Backup restaurado exitosamente' };
    } catch (error) {
        console.error('❌ Error restaurando backup:', error.message);
        return { success: false, error: error.message };
    }
}

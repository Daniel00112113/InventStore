import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Conexión compartida a la base de datos
let db = null;

export const getDatabase = () => {
    if (!db) {
        const dbPath = process.env.DB_PATH || join(__dirname, '../../database.db');
        db = new Database(dbPath);

        // Configuraciones de optimización
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = NORMAL');
        db.pragma('cache_size = 1000');
        db.pragma('temp_store = memory');

        console.log(`📊 Base de datos conectada: ${dbPath}`);
    }

    return db;
};

export default getDatabase();
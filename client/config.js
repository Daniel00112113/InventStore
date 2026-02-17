// Configuración del cliente
// Detecta automáticamente la URL de la API según el entorno

const CONFIG = {
    // Detectar API URL automáticamente
    API_URL: (() => {
        // Si estamos en desarrollo (localhost)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        }

        // En producción, usar el mismo origen
        return `${window.location.origin}/api`;
    })(),

    // Configuración de la aplicación
    APP_NAME: 'InvenStore',
    VERSION: '3.1.0',

    // Timeouts
    REQUEST_TIMEOUT: 30000, // 30 segundos

    // Configuración de caché
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
};

// Hacer CONFIG disponible globalmente pero inmutable
Object.freeze(CONFIG);
window.CONFIG = CONFIG;

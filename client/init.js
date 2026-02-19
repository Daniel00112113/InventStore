// Script de inicialización para asegurar que todo esté configurado correctamente
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando aplicación...');

    // Verificar dependencias críticas
    const dependencies = [
        { name: 'CONFIG', obj: window.CONFIG },
        { name: 'apiClient', obj: window.apiClient },
        { name: 'showNotification', obj: window.showNotification },
        { name: 'handleAPIError', obj: window.handleAPIError },
        { name: 'notifications', obj: window.notifications }
    ];

    let allDependenciesLoaded = true;

    dependencies.forEach(dep => {
        if (!dep.obj) {
            console.error(`❌ Dependencia faltante: ${dep.name}`);
            allDependenciesLoaded = false;
        } else {
            console.log(`✅ ${dep.name} cargado correctamente`);
        }
    });

    if (allDependenciesLoaded) {
        console.log('✅ Todas las dependencias cargadas correctamente');

        // Inicializar token en API client si existe
        const token = localStorage.getItem('token');
        if (token && window.apiClient) {
            window.apiClient.updateToken(token);
            console.log('🔐 Token restaurado en API client');
        }

        // Verificar conectividad inicial
        if (window.connectionMonitor) {
            window.connectionMonitor.forceCheck();
        }

        // Mostrar notificación de bienvenida en desarrollo
        if (window.CONFIG?.NODE_ENV === 'development') {
            setTimeout(() => {
                window.showNotification('Sistema inicializado correctamente', 'success', 2000);
            }, 1000);
        }

    } else {
        console.error('❌ Error en la inicialización: dependencias faltantes');

        // Mostrar error al usuario
        setTimeout(() => {
            alert('Error al cargar la aplicación. Por favor, recarga la página.');
        }, 1000);
    }
});

// Función de utilidad para verificar si la app está lista
window.isAppReady = function () {
    return !!(
        window.CONFIG &&
        window.apiClient &&
        window.showNotification &&
        window.handleAPIError &&
        window.notifications
    );
};

// Función para esperar a que la app esté lista
window.waitForApp = function (callback, maxAttempts = 50) {
    let attempts = 0;

    const check = () => {
        attempts++;

        if (window.isAppReady()) {
            callback();
        } else if (attempts < maxAttempts) {
            setTimeout(check, 100);
        } else {
            console.error('❌ Timeout esperando que la app esté lista');
            callback(new Error('App initialization timeout'));
        }
    };

    check();
};

console.log('📋 Script de inicialización cargado');
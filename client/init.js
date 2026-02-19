// Script de inicialización para asegurar que todo esté configurado correctamente
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando aplicación...');

    // Dar tiempo para que todos los scripts se carguen
    setTimeout(checkDependencies, 100);
});

function checkDependencies() {
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
        proceedWithInitialization();
    } else {
        // Intentar de nuevo después de un tiempo
        console.log('⏳ Reintentando carga de dependencias...');
        setTimeout(checkDependencies, 200);
    }
}

function proceedWithInitialization() {
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
}

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
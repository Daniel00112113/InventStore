// ========== MANEJO DE ERRORES GLOBAL ==========
// Captura y maneja errores de forma consistente

class ErrorHandler {
    constructor() {
        this.setupGlobalHandlers();
    }

    setupGlobalHandlers() {
        // Capturar errores no manejados
        window.addEventListener('error', (event) => {
            console.error('Error no manejado:', event.error);
            this.handleError(event.error);
        });

        // Capturar promesas rechazadas no manejadas
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promesa rechazada no manejada:', event.reason);
            this.handleError(event.reason);
        });
    }

    handleError(error) {
        // Verificar si es un error de API con estructura específica
        if (error && typeof error === 'object' && error.status !== undefined) {
            return this.handleAPIError(error);
        }

        // Error genérico
        this.showErrorNotification('Ha ocurrido un error inesperado');

        // En desarrollo, mostrar más detalles
        if (window.CONFIG?.NODE_ENV === 'development') {
            console.error('Error details:', error);
        }
    }

    handleAPIError(error) {
        // Manejar errores de autenticación
        if (error.status === 401) {
            this.handleUnauthorized();
            return;
        }

        // Manejar errores de permisos
        if (error.status === 403) {
            this.showErrorNotification('No tienes permisos para realizar esta acción');
            return;
        }

        // Manejar errores de red
        if (error.status === 0 || !error.status) {
            this.showErrorNotification('Error de conexión. Verifica tu internet.');
            return;
        }

        // Manejar errores del servidor
        if (error.status >= 500) {
            this.showErrorNotification('Error del servidor. Intenta de nuevo más tarde.');
            return;
        }

        // Error específico de la API
        const message = error.error || error.message || 'Error desconocido';
        this.showErrorNotification(message);
    }

    handleUnauthorized() {
        this.showErrorNotification('Sesión expirada. Por favor inicia sesión nuevamente.');

        // Limpiar sesión
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');

        // Redirigir al login después de 2 segundos
        setTimeout(() => {
            if (typeof showLogin === 'function') {
                showLogin();
            } else {
                window.location.reload();
            }
        }, 2000);
    }

    showErrorNotification(message) {
        if (window.notifications) {
            window.notifications.error(message);
        } else {
            alert(message);
        }
    }

    // Método para manejar errores de forma manual
    handle(error, customMessage = null) {
        if (customMessage) {
            this.showErrorNotification(customMessage);
        } else {
            this.handleError(error);
        }
    }
}

// Instancia global
const errorHandler = new ErrorHandler();

// Hacer disponible globalmente
window.errorHandler = errorHandler;

// Función helper para manejar errores en try-catch
window.handleError = (error, customMessage) => {
    errorHandler.handle(error, customMessage);
};

// Función específica para errores de API
window.handleAPIError = function (error, context = '') {
    console.error(`API Error ${context}:`, error);

    let message;
    if (error && typeof error === 'object') {
        message = error.error || error.message || 'Error de conexión';
    } else {
        message = error || 'Error desconocido';
    }

    if (window.showNotification) {
        window.showNotification(message, 'error');
    } else {
        alert(`Error ${context}: ${message}`);
    }
};

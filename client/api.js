// ========== MÓDULO DE API ==========
// Centraliza todas las llamadas HTTP con manejo de errores consistente

class APIClient {
    constructor() {
        this.baseURL = window.CONFIG?.API_URL || 'http://localhost:3000/api';
        this.timeout = window.CONFIG?.REQUEST_TIMEOUT || 30000;
    }

    getToken() {
        return localStorage.getItem('token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers,
            },
        };

        // Timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        config.signal = controller.signal;

        // Solo mostrar loading si no está deshabilitado explícitamente
        const showLoadingState = options.showLoading !== false;

        try {
            if (showLoadingState) showLoading(true);
            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            // Manejar respuestas no-JSON (como descargas)
            const contentType = response.headers.get('content-type');
            if (contentType && !contentType.includes('application/json')) {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new APIError(data.error || 'Error en la solicitud', response.status, data);
            }

            return data;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new APIError('La solicitud tardó demasiado tiempo', 408);
            }

            if (error instanceof APIError) {
                throw error;
            }

            // Error de red
            if (!navigator.onLine) {
                throw new APIError('Sin conexión a internet', 0);
            }

            throw new APIError(error.message || 'Error de conexión', 0);
        } finally {
            if (showLoadingState) showLoading(false);
        }
    }

    // Métodos HTTP
    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    patch(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

// Error personalizado para API
class APIError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }

    isUnauthorized() {
        return this.status === 401;
    }

    isForbidden() {
        return this.status === 403;
    }

    isNotFound() {
        return this.status === 404;
    }

    isServerError() {
        return this.status >= 500;
    }

    isNetworkError() {
        return this.status === 0;
    }
}

// Instancia global
const api = new APIClient();

// Hacer disponible globalmente
window.api = api;
window.APIError = APIError;

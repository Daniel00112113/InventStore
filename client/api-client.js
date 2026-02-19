// Sistema robusto de conexión API con fallbacks y reintentos
class RobustAPIClient {
    constructor() {
        this.baseURLs = this.getBaseURLs();
        this.currentURLIndex = 0;
        this.maxRetries = 3;
        this.timeout = 30000; // 30 segundos
        this.token = localStorage.getItem('token');

        // Actualizar token cuando cambie en localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'token') {
                this.token = e.newValue;
            }
        });
    }

    getBaseURLs() {
        const origin = window.location.origin;

        // URLs principales y de fallback
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return [
                'http://localhost:3000/api',
                'http://127.0.0.1:3000/api',
                `${origin}/api`
            ];
        }

        return [
            `${origin}/api`,
            `${origin}/api/v1`,
            `${origin}/backend/api`
        ];
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    async makeRequest(endpoint, options = {}) {
        const { method = 'GET', body, retryCount = 0 } = options;

        // Rutas alternativas para evitar ad blockers
        const alternativeRoutes = {
            '/categories': ['/categories', '/inventory/categories', '/store/categories', '/data/categories'],
            '/products': ['/products', '/inventory/products', '/store/products', '/data/products'],
            '/customers': ['/customers', '/store/customers', '/data/customers'],
            '/sales': ['/sales', '/store/sales', '/data/sales'],
            '/dashboard': ['/dashboard', '/stats/dashboard', '/data/dashboard']
        };

        const routes = alternativeRoutes[endpoint] || [endpoint];

        for (const baseURL of this.baseURLs) {
            for (const route of routes) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

                    const response = await fetch(`${baseURL}${route}`, {
                        method,
                        headers: this.getHeaders(),
                        body: body ? JSON.stringify(body) : undefined,
                        signal: controller.signal,
                        credentials: 'same-origin'
                    });

                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const data = await response.json();
                        console.log(`✅ API Success: ${method} ${baseURL}${route}`);
                        return { success: true, data, status: response.status };
                    }

                    if (response.status === 401) {
                        this.handleAuthError();
                        return { success: false, error: 'No autorizado', status: 401 };
                    }

                    const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
                    console.warn(`⚠️ API Error: ${response.status} ${baseURL}${route}`, errorData);

                    // Si es un error del servidor, intentar siguiente ruta
                    if (response.status >= 500) continue;

                    return { success: false, error: errorData.error || 'Error del servidor', status: response.status };

                } catch (error) {
                    console.warn(`🔄 Connection failed: ${baseURL}${route}`, error.message);

                    // Si es error de red o timeout, continuar con siguiente URL/ruta
                    if (error.name === 'AbortError') {
                        console.warn('⏱️ Request timeout');
                    }
                    continue;
                }
            }
        }

        // Si llegamos aquí, todos los intentos fallaron
        if (retryCount < this.maxRetries) {
            console.log(`🔄 Retrying request ${retryCount + 1}/${this.maxRetries}`);
            await this.delay(1000 * (retryCount + 1)); // Backoff exponencial
            return this.makeRequest(endpoint, { ...options, retryCount: retryCount + 1 });
        }

        return {
            success: false,
            error: 'No se pudo conectar con el servidor. Verifica tu conexión.',
            status: 0
        };
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    handleAuthError() {
        localStorage.removeItem('token');
        this.token = null;

        // Mostrar notificación de sesión expirada
        if (window.showNotification) {
            window.showNotification('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
        }

        // Redirigir al login después de un breve delay
        setTimeout(() => {
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }, 2000);
    }

    updateToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // Métodos específicos para cada endpoint
    async getCategories() {
        return this.makeRequest('/categories');
    }

    async createCategory(categoryData) {
        return this.makeRequest('/categories', {
            method: 'POST',
            body: categoryData
        });
    }

    async updateCategory(id, categoryData) {
        return this.makeRequest(`/categories/${id}`, {
            method: 'PUT',
            body: categoryData
        });
    }

    async deleteCategory(id) {
        return this.makeRequest(`/categories/${id}`, {
            method: 'DELETE'
        });
    }

    async getProducts(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        const endpoint = queryString ? `/products?${queryString}` : '/products';
        return this.makeRequest(endpoint);
    }

    async createProduct(productData) {
        return this.makeRequest('/products', {
            method: 'POST',
            body: productData
        });
    }

    async updateProduct(id, productData) {
        return this.makeRequest(`/products/${id}`, {
            method: 'PUT',
            body: productData
        });
    }

    async deleteProduct(id) {
        return this.makeRequest(`/products/${id}`, {
            method: 'DELETE'
        });
    }

    async getCustomers() {
        return this.makeRequest('/customers');
    }

    async createCustomer(customerData) {
        return this.makeRequest('/customers', {
            method: 'POST',
            body: customerData
        });
    }

    async getDashboardData() {
        return this.makeRequest('/dashboard');
    }

    async getSales(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        const endpoint = queryString ? `/sales?${queryString}` : '/sales';
        return this.makeRequest(endpoint);
    }

    async createSale(saleData) {
        return this.makeRequest('/sales', {
            method: 'POST',
            body: saleData
        });
    }

    async login(credentials) {
        return this.makeRequest('/auth/login', {
            method: 'POST',
            body: credentials
        });
    }

    async login(credentials) {
        return this.makeRequest('/auth/login', {
            method: 'POST',
            body: credentials
        });
    }

    async getReports(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        const endpoint = queryString ? `/reports?${queryString}` : '/reports';
        return this.makeRequest(endpoint);
    }

    async getCashRegisterSummary() {
        return this.makeRequest('/cash-register/summary');
    }

    async closeCashRegister(closingData) {
        return this.makeRequest('/cash-register/close', {
            method: 'POST',
            body: closingData
        });
    }
}

// Crear instancia global
window.apiClient = new RobustAPIClient();

console.log('✅ API Client initialized with robust connection handling');
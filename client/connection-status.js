// Sistema de monitoreo de conexión y estado del servidor
class ConnectionMonitor {
    constructor() {
        this.isOnline = navigator.onLine;
        this.serverStatus = 'unknown';
        this.lastCheck = null;
        this.checkInterval = null;
        this.indicator = null;

        this.init();
    }

    init() {
        this.createIndicator();
        this.setupEventListeners();
        this.startMonitoring();
    }

    createIndicator() {
        // Crear indicador de estado en la navbar
        const navbar = document.querySelector('.navbar-actions');
        if (navbar) {
            this.indicator = document.createElement('div');
            this.indicator.className = 'connection-indicator';
            this.indicator.innerHTML = `
                <span class="status-dot"></span>
                <span class="status-text">Conectando...</span>
            `;
            navbar.insertBefore(this.indicator, navbar.firstChild);
        }
    }

    setupEventListeners() {
        // Escuchar cambios de conectividad
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.checkServerStatus();
            window.showNotification('Conexión restaurada', 'success', 3000);
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateIndicator('offline', 'Sin conexión');
            window.showNotification('Sin conexión a internet', 'warning', 5000);
        });

        // Escuchar errores de API
        window.addEventListener('api-error', (event) => {
            this.handleAPIError(event.detail);
        });

        // Escuchar éxitos de API
        window.addEventListener('api-success', () => {
            this.serverStatus = 'online';
            this.updateIndicator('online', 'Conectado');
        });
    }

    startMonitoring() {
        // Verificar estado inicial
        this.checkServerStatus();

        // Verificar cada 30 segundos
        this.checkInterval = setInterval(() => {
            if (this.isOnline) {
                this.checkServerStatus();
            }
        }, 30000);
    }

    async checkServerStatus() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch('/api/health', {
                method: 'GET',
                signal: controller.signal,
                cache: 'no-cache'
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                this.serverStatus = 'online';
                this.updateIndicator('online', 'Conectado');
                this.lastCheck = new Date();
            } else {
                this.serverStatus = 'error';
                this.updateIndicator('error', 'Error del servidor');
            }
        } catch (error) {
            this.serverStatus = 'offline';
            this.updateIndicator('offline', 'Servidor no disponible');
            console.warn('Server health check failed:', error.message);
        }
    }

    updateIndicator(status, text) {
        if (!this.indicator) return;

        const dot = this.indicator.querySelector('.status-dot');
        const textEl = this.indicator.querySelector('.status-text');

        // Remover clases anteriores
        dot.className = 'status-dot';

        // Agregar nueva clase
        dot.classList.add(`status-${status}`);
        textEl.textContent = text;

        // Agregar tooltip con información adicional
        const tooltip = this.getTooltip(status);
        this.indicator.title = tooltip;
    }

    getTooltip(status) {
        const now = new Date().toLocaleTimeString();

        switch (status) {
            case 'online':
                return `Servidor conectado - Última verificación: ${now}`;
            case 'offline':
                return `Servidor desconectado - Verificado: ${now}`;
            case 'error':
                return `Error del servidor - Verificado: ${now}`;
            default:
                return `Estado desconocido - ${now}`;
        }
    }

    handleAPIError(error) {
        if (error.status === 0 || error.status >= 500) {
            this.serverStatus = 'error';
            this.updateIndicator('error', 'Error del servidor');
        } else if (error.status === 401) {
            this.updateIndicator('warning', 'No autorizado');
        }
    }

    // Método público para forzar verificación
    forceCheck() {
        this.checkServerStatus();
    }

    // Método para obtener estado actual
    getStatus() {
        return {
            isOnline: this.isOnline,
            serverStatus: this.serverStatus,
            lastCheck: this.lastCheck
        };
    }

    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        if (this.indicator) {
            this.indicator.remove();
        }
    }
}

// CSS para el indicador
const connectionCSS = `
.connection-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    font-size: 12px;
    cursor: pointer;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pulse 2s infinite;
}

.status-dot.status-online {
    background: #4CAF50;
}

.status-dot.status-offline {
    background: #f44336;
}

.status-dot.status-error {
    background: #ff9800;
}

.status-dot.status-warning {
    background: #ffeb3b;
}

.status-text {
    color: white;
    font-weight: 500;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

@media (max-width: 768px) {
    .status-text {
        display: none;
    }
}
`;

// Inyectar CSS
const style = document.createElement('style');
style.textContent = connectionCSS;
document.head.appendChild(style);

// Inicializar monitor cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.connectionMonitor = new ConnectionMonitor();

    // Extender el API client para emitir eventos cuando esté disponible
    setTimeout(() => {
        if (window.apiClient) {
            const originalMakeRequest = window.apiClient.makeRequest;
            window.apiClient.makeRequest = async function (...args) {
                const result = await originalMakeRequest.apply(this, args);

                if (result.success) {
                    window.dispatchEvent(new CustomEvent('api-success'));
                } else {
                    window.dispatchEvent(new CustomEvent('api-error', { detail: result }));
                }

                return result;
            };
        }
    }, 100);
});

console.log('✅ Connection Monitor initialized');
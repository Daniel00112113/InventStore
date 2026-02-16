// ========== SISTEMA DE LOADING ==========
// Indicadores de carga globales y por componente

class LoadingManager {
    constructor() {
        this.activeRequests = 0;
        this.overlay = null;
        this.init();
    }

    init() {
        // Crear overlay de loading global
        this.overlay = document.createElement('div');
        this.overlay.id = 'loading-overlay';
        this.overlay.className = 'loading-overlay hidden';
        this.overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p class="loading-text">Cargando...</p>
            </div>
        `;
        document.body.appendChild(this.overlay);
    }

    show(text = 'Cargando...') {
        this.activeRequests++;

        // Solo mostrar overlay si no hay modales abiertos
        if (this.activeRequests === 1) {
            const textElement = this.overlay.querySelector('.loading-text');
            if (textElement) textElement.textContent = text;

            // No mostrar overlay si hay un modal abierto
            // Esperar un tick para que el DOM se actualice
            setTimeout(() => {
                const hasOpenModal = document.querySelector('.modal:not(.hidden)');
                if (!hasOpenModal && this.activeRequests > 0) {
                    this.overlay.classList.remove('hidden');
                }
            }, 10);
        }
    }

    hide() {
        this.activeRequests = Math.max(0, this.activeRequests - 1);

        if (this.activeRequests === 0) {
            this.overlay.classList.add('hidden');
        }
    }

    // Loading para elementos específicos
    showInElement(element, text = 'Cargando...') {
        if (!element) return;

        const loader = document.createElement('div');
        loader.className = 'element-loading';
        loader.innerHTML = `
            <div class="spinner-small"></div>
            <span>${text}</span>
        `;

        element.style.position = 'relative';
        element.appendChild(loader);

        return loader;
    }

    hideInElement(element) {
        if (!element) return;

        const loader = element.querySelector('.element-loading');
        if (loader) loader.remove();
    }
}

// Instancia global
const loadingManager = new LoadingManager();

// Funciones globales
window.showLoading = (show = true, text) => {
    if (show) {
        loadingManager.show(text);
    } else {
        loadingManager.hide();
    }
};

window.loadingManager = loadingManager;

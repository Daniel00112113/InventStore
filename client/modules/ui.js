// Módulo de UI y navegación
import { getCurrentUser } from './state.js';

let loginScreen;
let dashboardScreen;
let views = {};

// Inicializar referencias al DOM cuando esté listo
function initDOMReferences() {
    loginScreen = document.getElementById('login-screen');
    dashboardScreen = document.getElementById('dashboard-screen');

    views = {
        dashboard: document.getElementById('dashboard-view'),
        sales: document.getElementById('sales-view'),
        invoices: document.getElementById('invoices-view'),
        products: document.getElementById('products-view'),
        categories: document.getElementById('categories-view'),
        customers: document.getElementById('customers-view'),
        returns: document.getElementById('returns-view'),
        'cash-register': document.getElementById('cash-register-view'),
        reports: document.getElementById('reports-view'),
        users: document.getElementById('users-view')
    };

    // Verificar que todas las vistas existen
    Object.keys(views).forEach(key => {
        if (!views[key]) {
            console.error(`Vista no encontrada: ${key}`);
        }
    });
}

export { views };

export function showLogin() {
    if (!loginScreen || !dashboardScreen) {
        console.error('Login/Dashboard screens not initialized');
        return;
    }
    loginScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
}

export function showDashboard() {
    if (!loginScreen || !dashboardScreen) {
        console.error('Login/Dashboard screens not initialized');
        return;
    }
    loginScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    const currentUser = getCurrentUser();
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = currentUser?.fullName || '';
    }
}

export function initDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const isDarkMode = localStorage.getItem('darkMode') === 'true';

    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.textContent = '☀️';
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDark);
            darkModeToggle.textContent = isDark ? '☀️' : '🌙';
        });
    }
}

export function initMenuNavigation(viewLoaders) {
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const viewName = btn.dataset.view;
            document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            Object.values(views).forEach(v => {
                if (v) v.classList.add('hidden');
            });
            if (views[viewName]) {
                views[viewName].classList.remove('hidden');
            }

            // Llamar al loader correspondiente
            if (viewLoaders[viewName]) {
                viewLoaders[viewName]();
            }
        });
    });
}

// Inicializar cuando el DOM esté listo
export function initUI() {
    initDOMReferences();
}

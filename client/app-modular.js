// Archivo principal modularizado
import { getToken } from './modules/state.js';
import { initLoginForm, initLogoutButton } from './modules/auth.js';
import { showLogin, showDashboard, initDarkMode, initMenuNavigation, initUI } from './modules/ui.js';
import { loadDashboard } from './modules/dashboard.js';
import { loadProducts, initProductsEventListeners } from './modules/products.js';
import { loadCategories, initCategoriesEventListeners } from './modules/categories.js';
import { loadCustomers, initCustomersEventListeners } from './modules/customers.js';
import { loadSalesView, initSalesEventListeners } from './modules/sales.js';

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar referencias al DOM
    initUI();

    // Inicializar modo oscuro
    initDarkMode();

    // Verificar si hay token guardado
    if (getToken()) {
        showDashboard();
        initDashboardEventListeners();
        loadDashboard();
    } else {
        showLogin();
    }

    // Inicializar formulario de login
    initLoginForm(() => {
        showDashboard();
        initDashboardEventListeners();
        loadDashboard();
    });
});

function initDashboardEventListeners() {
    initLogoutButton(showLogin);

    // Configurar navegación con los loaders de cada vista
    const viewLoaders = {
        dashboard: loadDashboard,
        products: loadProducts,
        categories: loadCategories,
        customers: loadCustomers,
        sales: loadSalesView,
        invoices: () => {
            if (typeof window.loadInvoicesView === 'function') {
                window.loadInvoicesView();
            }
        },
        returns: () => {
            if (typeof window.loadReturnsView === 'function') {
                window.loadReturnsView();
            }
        },
        'cash-register': () => {
            if (typeof window.loadCashRegisterView === 'function') {
                window.loadCashRegisterView();
            }
        },
        reports: () => {
            if (typeof window.loadReportsView === 'function') {
                window.loadReportsView();
            }
        },
        users: () => {
            if (typeof window.showUsers === 'function') {
                window.showUsers();
            }
        }
    };

    initMenuNavigation(viewLoaders);
    initProductsEventListeners();
    initCategoriesEventListeners();
    initCustomersEventListeners();
    initSalesEventListeners();

    // Inicializar otros módulos que aún no están modularizados
    if (typeof window.initInvoicesEventListeners === 'function') {
        window.initInvoicesEventListeners();
    }
    if (typeof window.initReturnsEventListeners === 'function') {
        window.initReturnsEventListeners();
    }
    if (typeof window.initCashRegisterEventListeners === 'function') {
        window.initCashRegisterEventListeners();
    }
    if (typeof window.initReportsEventListeners === 'function') {
        window.initReportsEventListeners();
    }
    if (typeof window.initUsersView === 'function') {
        window.initUsersView();
    }
}

// Exponer loadDashboard globalmente para otros módulos
window.loadDashboard = loadDashboard;

// Configuración se carga desde config.js
const API_URL = window.CONFIG?.API_URL || 'http://localhost:3000/api';
let token = localStorage.getItem('token');

// Usar el cliente API global
const apiClient = window.api;

// Helper function para validar elementos del DOM
function safeGetElement(id, warnIfMissing = true) {
    const element = document.getElementById(id);
    if (!element && warnIfMissing) {
        console.warn(`Element with id '${id}' not found in DOM`);
    }
    return element;
}

// Variables globales de la aplicación
let currentUser = null;
let saleItems = [];
let showLowStockOnly = false;
let showDebtOnly = false;
let lastSaleId = null;
let currentTotal = 0;
let allProducts = [];
let searchTimeout = null;
let salesViewInitialized = false;
let reportsViewInitialized = false;
let returnsViewInitialized = false;
let invoicesViewInitialized = false;
let returnItems = [];
let selectedSaleId = null;
let cashRegisterViewInitialized = false;
let currentClosingSummary = null;

const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');

// Agregar clase login-page al body inicialmente
document.body.classList.add('login-page');

const views = {
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

if (token) {
    showDashboard();
} else {
    showLogin();
}

// Función de inicialización principal
function initApp() {
    // Inicializar formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('login-error');

            try {
                const result = await window.apiClient.login({ username, password });

                if (result.success) {
                    token = result.data.token;
                    currentUser = result.data.user;
                    localStorage.setItem('token', token);

                    // Actualizar el token en el API client
                    window.apiClient.updateToken(token);

                    errorDiv.textContent = '';
                    showDashboard();
                } else {
                    errorDiv.textContent = result.error || 'Error de autenticación';
                }
            } catch (error) {
                if (error && error.error) {
                    errorDiv.textContent = error.error;
                } else {
                    errorDiv.textContent = 'Error de conexión';
                }
            }
        });
    }

    // Inicializar botón de logout
    initLogoutButton();

    // Verificar si ya hay token y mostrar dashboard
    if (token) {
        window.apiClient.updateToken(token);
        showDashboard();
    }
}

// Esperar a que la app esté lista antes de inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.waitForApp((error) => {
            if (error) {
                console.error('❌ Error en inicialización:', error);
                return;
            }
            initApp();
        });
    });
} else {
    // DOM ya está listo
    window.waitForApp((error) => {
        if (error) {
            console.error('❌ Error en inicialización:', error);
            return;
        }
        initApp();
    });
}

}

function initLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            token = null;
            currentUser = null;
            localStorage.removeItem('token');
            showLogin();
        });
    }
}

function showLogin() {
    loginScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
    document.body.classList.add('login-page');
}

function initDashboardEventListeners() {
    initLogoutButton();
    initMenuNavigation();
    initProductsEventListeners();
    initCategoriesEventListeners();
    initCustomersEventListeners();
    initSalesEventListeners();
    initInvoicesEventListeners();
    initReturnsEventListeners();
    initCashRegisterEventListeners();
    initReportsEventListeners();
    initUsersView();
}

function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    document.body.classList.remove('login-page');
    document.getElementById('user-name').textContent = currentUser?.fullName || '';

    // Guardar rol del usuario para control de acceso
    if (currentUser?.role) {
        localStorage.setItem('userRole', currentUser.role);
    }

    initDashboardEventListeners();
    loadDashboard();
}

function initMenuNavigation() {
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const viewName = btn.dataset.view;
            document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            Object.values(views).forEach(v => v.classList.add('hidden'));
            views[viewName].classList.remove('hidden');

            if (viewName === 'dashboard') loadDashboard();
            if (viewName === 'products') loadProducts();
            if (viewName === 'categories') loadCategories();
            if (viewName === 'customers') loadCustomers();
            if (viewName === 'sales') loadSalesView();
            if (viewName === 'invoices') loadInvoicesView();
            if (viewName === 'returns') loadReturnsView();
            if (viewName === 'cash-register') loadCashRegisterView();
            if (viewName === 'reports') loadReportsView();
            if (viewName === 'users') showUsers();
        });
    });
}

async function loadDashboard() {
    try {
        const result = await window.apiClient.getDashboardData();

        if (result.success) {
            const data = result.data;
            document.getElementById('daily-sales').textContent = `${data.dailySales.toLocaleString()}`;
            document.getElementById('monthly-sales').textContent = `${data.monthlySales.toLocaleString()}`;
            document.getElementById('monthly-profit').textContent = `${data.monthlyProfit.toLocaleString()}`;
            document.getElementById('low-stock').textContent = data.lowStockCount;
            document.getElementById('pending-credit').textContent = `${data.pendingCredit.toLocaleString()}`;

            // Cargar gráficos del dashboard
            if (typeof loadDashboardCharts === 'function') {
                loadDashboardCharts();
            }
        } else {
            window.handleAPIError(result, 'cargando dashboard');
        }
    } catch (error) {
        window.handleAPIError(error, 'cargando dashboard');
    }
}


// ========== PRODUCTS ==========
async function loadProducts() {
    try {
        const filters = showLowStockOnly ? { lowStock: true } : {};
        const result = await window.apiClient.getProducts(filters);

        if (result.success) {
            const products = result.data;

            const presentationEmojis = {
                'unidad': '📦',
                'suelto': '🥄',
                'paquete': '📦',
                'bolsa': '🛍️',
                'caja': '📦',
                'botella': '🍾',
                'lata': '🥫',
                'kilo': '⚖️',
                'libra': '⚖️'
            };

            const list = document.getElementById('products-list');
            list.innerHTML = products.map(p => `
            <div class="list-item">
                <div>
                    <strong>${p.name}</strong>
                    ${p.presentation ? `<span class="badge badge-info">${presentationEmojis[p.presentation] || '📦'} ${p.presentation}</span>` : ''}
                    ${p.stock <= p.min_stock ? '<span class="low-stock-badge">Stock Bajo</span>' : ''}
                    <br>
                    <small>Stock: ${p.stock} | Costo: $${p.cost_price} | Venta: $${p.sale_price}</small>
                </div>
                <div class="item-actions">
                    <button class="btn-small btn-edit" onclick="editProduct(${p.id})">Editar</button>
                    <button class="btn-small btn-danger" onclick="deleteProduct(${p.id})">Eliminar</button>
                </div>
            </div>
        `).join('');
        } else {
            window.handleAPIError(result, 'cargando productos');
        }
    } catch (error) {
        window.handleAPIError(error, 'cargando productos');
    }
}


async function loadCategoriesForSelect() {
    try {
        const result = await window.apiClient.getCategories();

        if (result.success) {
            const categories = result.data;
            const select = document.getElementById('product-category');
            if (select) {
                select.innerHTML = '<option value="">Sin categoría</option>' +
                    categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            }
        } else {
            window.handleAPIError(result, 'cargando categorías para selector');
        }
    } catch (error) {
        window.handleAPIError(error, 'cargando categorías para selector');
    }
}

function initProductsEventListeners() {
    const lowStockFilter = document.getElementById('low-stock-filter');
    const addProductBtn = document.getElementById('add-product-btn');

    // Solo validar elementos de la vista, no del modal
    if (!lowStockFilter || !addProductBtn) {
        return;
    }

    lowStockFilter.addEventListener('click', () => {
        showLowStockOnly = !showLowStockOnly;
        lowStockFilter.textContent = showLowStockOnly ? 'Ver Todos' : 'Ver Stock Bajo';
        loadProducts();
    });

    addProductBtn.addEventListener('click', async () => {
        await loadCategoriesForSelect();
        const modalTitle = document.getElementById('product-modal-title');
        const productId = document.getElementById('product-id');
        const modal = document.getElementById('product-modal');

        if (modalTitle) modalTitle.textContent = 'Agregar Producto';
        const productForm = document.getElementById('product-form');
        if (productForm) productForm.reset();
        if (productId) productId.value = '';
        if (modal) modal.classList.remove('hidden');
    });

    // Event listener para cancelar - buscar el elemento cuando se necesite
    const cancelProductBtn = document.getElementById('cancel-product-btn');
    if (cancelProductBtn) {
        cancelProductBtn.addEventListener('click', () => {
            const modal = document.getElementById('product-modal');
            if (modal) modal.classList.add('hidden');
        });
    }

    // Event listener para el formulario
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('product-id')?.value;
            const data = {
                name: document.getElementById('product-name')?.value,
                presentation: document.getElementById('product-presentation')?.value || 'unidad',
                barcode: document.getElementById('product-barcode')?.value,
                categoryId: document.getElementById('product-category')?.value || null,
                costPrice: parseFloat(document.getElementById('product-cost')?.value),
                salePrice: parseFloat(document.getElementById('product-price')?.value),
                stock: parseInt(document.getElementById('product-stock')?.value),
                minStock: parseInt(document.getElementById('product-min-stock')?.value),
                unitType: document.getElementById('product-unit-type')?.value || null,
                unitsPerPack: parseInt(document.getElementById('product-units-per-pack')?.value) || null,
                packPrice: parseFloat(document.getElementById('product-pack-price')?.value) || null,
                wholesaleQuantity: parseInt(document.getElementById('product-wholesale-qty')?.value) || null,
                wholesalePrice: parseFloat(document.getElementById('product-wholesale-price')?.value) || null
            };

            try {
                let result;
                if (id) {
                    result = await window.apiClient.updateProduct(id, data);
                } else {
                    result = await window.apiClient.createProduct(data);
                }

                if (result.success) {
                    const modal = document.getElementById('product-modal');
                    if (modal) modal.classList.add('hidden');
                    loadProducts();
                    window.showNotification(
                        id ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente',
                        'success'
                    );
                } else {
                    window.handleAPIError(result, id ? 'actualizando producto' : 'creando producto');
                }
            } catch (error) {
                window.handleAPIError(error, id ? 'actualizando producto' : 'creando producto');
            }
        });
    }

    window.editProduct = async (id) => {
        try {
            await loadCategoriesForSelect();
            const res = await fetch(`${API_URL}/products`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const products = await res.json();
            const product = products.find(p => p.id === id);

            if (product) {
                document.getElementById('product-modal-title').textContent = 'Editar Producto';
                document.getElementById('product-id').value = product.id;
                document.getElementById('product-name').value = product.name;
                document.getElementById('product-presentation').value = product.presentation || 'unidad';
                document.getElementById('product-barcode').value = product.barcode || '';
                document.getElementById('product-category').value = product.category_id || '';
                document.getElementById('product-cost').value = product.cost_price;
                document.getElementById('product-price').value = product.sale_price;
                document.getElementById('product-stock').value = product.stock;
                document.getElementById('product-min-stock').value = product.min_stock;
                document.getElementById('product-unit-type').value = product.unit_type || '';
                document.getElementById('product-units-per-pack').value = product.units_per_pack || '';
                document.getElementById('product-pack-price').value = product.pack_price || '';
                document.getElementById('product-wholesale-qty').value = product.wholesale_quantity || '';
                document.getElementById('product-wholesale-price').value = product.wholesale_price || '';
                document.getElementById('product-modal').classList.remove('hidden');
            }
        } catch (error) {
            alert('Error al cargar producto');
        }
    };

    window.deleteProduct = async (id) => {
        if (!confirm('¿Eliminar este producto?')) return;

        try {
            const res = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                loadProducts();
            } else {
                alert('Error al eliminar producto');
            }
        } catch (error) {
            alert('Error de conexión');
        }
    };
}

// ========== CATEGORIES ==========
async function loadCategories() {
    try {
        const res = await fetch(`${API_URL}/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const categories = await res.json();

        const list = document.getElementById('categories-list');
        list.innerHTML = categories.map(c => `
            <div class="list-item">
                <div>
                    <strong>${c.name}</strong>
                    <br>
                    <small>${c.description || 'Sin descripción'} | ${c.product_count} productos</small>
                </div>
                <div class="item-actions">
                    <button class="btn-small btn-edit" onclick="editCategory(${c.id})">Editar</button>
                    <button class="btn-small btn-danger" onclick="deleteCategory(${c.id})">Eliminar</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function initCategoriesEventListeners() {
    const addCategoryBtn = document.getElementById('add-category-btn');
    const cancelCategoryBtn = document.getElementById('cancel-category-btn');
    const categoryForm = document.getElementById('category-form');

    if (!addCategoryBtn || !cancelCategoryBtn || !categoryForm) {
        return; // Elementos solo existen cuando la vista está activa
    }

    addCategoryBtn.addEventListener('click', () => {
        document.getElementById('category-modal-title').textContent = 'Agregar Categoría';
        categoryForm.reset();
        document.getElementById('category-id').value = '';
        document.getElementById('category-modal').classList.remove('hidden');
    });

    cancelCategoryBtn.addEventListener('click', () => {
        document.getElementById('category-modal').classList.add('hidden');
    });

    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('category-id').value;
        const data = {
            name: document.getElementById('category-name').value,
            description: document.getElementById('category-description').value
        };

        try {
            const url = id ? `${API_URL}/categories/${id}` : `${API_URL}/categories`;
            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                document.getElementById('category-modal').classList.add('hidden');
                loadCategories();
            } else {
                alert('Error al guardar categoría');
            }
        } catch (error) {
            alert('Error de conexión');
        }
    });
}

window.editCategory = async (id) => {
    try {
        const res = await fetch(`${API_URL}/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const categories = await res.json();
        const category = categories.find(c => c.id === id);

        if (category) {
            document.getElementById('category-modal-title').textContent = 'Editar Categoría';
            document.getElementById('category-id').value = category.id;
            document.getElementById('category-name').value = category.name;
            document.getElementById('category-description').value = category.description || '';
            document.getElementById('category-modal').classList.remove('hidden');
        }
    } catch (error) {
        alert('Error al cargar categoría');
    }
};

window.deleteCategory = async (id) => {
    if (!confirm('¿Eliminar esta categoría?')) return;

    try {
        const res = await fetch(`${API_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            loadCategories();
        } else {
            alert('Error al eliminar categoría');
        }
    } catch (error) {
        alert('Error de conexión');
    }
};

// ========== CUSTOMERS ==========
async function loadCustomers() {
    try {
        const endpoint = showDebtOnly ? `${API_URL}/customers/with-debt` : `${API_URL}/customers`;
        const res = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const customers = await res.json();

        const list = document.getElementById('customers-list');
        list.innerHTML = customers.map(c => `
            <div class="list-item">
                <div>
                    <strong>${c.name}</strong>
                    ${c.balance > 0 ? `<span class="debt-badge">Debe: $${c.balance.toLocaleString()}</span>` : ''}
                    <br>
                    <small>${c.phone || 'Sin teléfono'} | ${c.address || 'Sin dirección'}</small>
                </div>
                <div class="item-actions">
                    ${c.balance > 0 ? `<button class="btn-small btn-pay" onclick="showPaymentModal(${c.id}, '${c.name}', ${c.balance})">Pagar</button>` : ''}
                    <button class="btn-small btn-edit" onclick="editCustomer(${c.id})">Editar</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

function initCustomersEventListeners() {
    const debtFilter = document.getElementById('debt-filter');
    const addCustomerBtn = document.getElementById('add-customer-btn');
    const cancelCustomerBtn = document.getElementById('cancel-customer-btn');
    const customerForm = document.getElementById('customer-form');
    const cancelPaymentBtn = document.getElementById('cancel-payment');
    const paymentForm = document.getElementById('payment-form');

    if (!debtFilter || !addCustomerBtn || !cancelCustomerBtn || !customerForm) {
        return; // Elementos solo existen cuando la vista está activa
    }

    debtFilter.addEventListener('click', () => {
        showDebtOnly = !showDebtOnly;
        debtFilter.textContent = showDebtOnly ? 'Ver Todos' : 'Ver Con Deuda';
        loadCustomers();
    });

    addCustomerBtn.addEventListener('click', () => {
        const modalTitle = document.getElementById('customer-modal-title');
        const customerId = document.getElementById('customer-id');
        const modal = document.getElementById('customer-modal');

        if (modalTitle) modalTitle.textContent = 'Agregar Cliente';
        customerForm.reset();
        if (customerId) customerId.value = '';
        if (modal) modal.classList.remove('hidden');
    });

    cancelCustomerBtn.addEventListener('click', () => {
        const modal = document.getElementById('customer-modal');
        if (modal) modal.classList.add('hidden');
    });

    customerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('customer-id')?.value;
        const data = {
            name: document.getElementById('customer-name')?.value,
            phone: document.getElementById('customer-phone')?.value,
            address: document.getElementById('customer-address')?.value
        };

        try {
            const url = id ? `${API_URL}/customers/${id}` : `${API_URL}/customers`;
            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                const modal = document.getElementById('customer-modal');
                if (modal) modal.classList.add('hidden');
                loadCustomers();
            } else {
                alert('Error al guardar cliente');
            }
        } catch (error) {
            alert('Error de conexión');
        }
    });

    if (cancelPaymentBtn) {
        cancelPaymentBtn.addEventListener('click', () => {
            const modal = document.getElementById('payment-modal');
            if (modal) modal.classList.add('hidden');
        });
    }

    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const customerId = document.getElementById('payment-customer-id')?.value;
            const amount = parseFloat(document.getElementById('payment-amount')?.value);

            try {
                const res = await fetch(`${API_URL}/customers/${customerId}/payment`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ amount })
                });

                if (res.ok) {
                    const modal = document.getElementById('payment-modal');
                    if (modal) modal.classList.add('hidden');
                    loadCustomers();
                    loadDashboard();
                } else {
                    const error = await res.json();
                    alert(error.error);
                }
            } catch (error) {
                alert('Error de conexión');
            }
        });
    }
}

window.editCustomer = async (id) => {
    try {
        const res = await fetch(`${API_URL}/customers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const customers = await res.json();
        const customer = customers.find(c => c.id === id);

        if (customer) {
            document.getElementById('customer-modal-title').textContent = 'Editar Cliente';
            document.getElementById('customer-id').value = customer.id;
            document.getElementById('customer-name').value = customer.name;
            document.getElementById('customer-phone').value = customer.phone || '';
            document.getElementById('customer-address').value = customer.address || '';
            document.getElementById('customer-modal').classList.remove('hidden');
        }
    } catch (error) {
        alert('Error al cargar cliente');
    }
};

window.showPaymentModal = (id, name, balance) => {
    document.getElementById('payment-customer-id').value = id;
    document.getElementById('payment-customer-name').textContent = name;
    document.getElementById('payment-customer-balance').textContent = `$${balance.toLocaleString()}`;
    document.getElementById('payment-amount').max = balance;
    document.getElementById('payment-modal').classList.remove('hidden');
};

// ========== SALES ==========
async function loadAllProductsForSale() {
    try {
        const res = await fetch(`${API_URL}/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        allProducts = await res.json();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

async function loadSalesView() {
    if (!salesViewInitialized) {
        salesViewInitialized = true;
    }
    await loadAllProductsForSale();
    updateSaleDisplay();
}

async function loadCustomersForSale() {
    const res = await fetch(`${API_URL}/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const customers = await res.json();

    const select = document.getElementById('customer-select');
    if (!select) {
        console.warn('customer-select element not found');
        return;
    }

    select.innerHTML = '<option value="">Seleccionar cliente</option>' +
        customers.map(c => `<option value="${c.id}">${c.name}${c.balance > 0 ? ' (Debe: ' + c.balance.toLocaleString() + ')' : ''}</option>`).join('');
}


function searchProducts(query) {
    const suggestions = document.getElementById('product-suggestions');

    if (!query || query.length < 2) {
        suggestions.innerHTML = '';
        return;
    }

    const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.barcode && p.barcode.includes(query))
    ).slice(0, 5);

    if (filtered.length === 0) {
        suggestions.innerHTML = '<div class="suggestion-item">No se encontraron productos</div>';
        return;
    }

    suggestions.innerHTML = filtered.map(p => `
        <div class="suggestion-item" onclick="addProductToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.sale_price}, ${p.stock})">
            <div class="suggestion-info">
                <strong>${p.name}</strong>
                <small>Stock: ${p.stock} | $${p.sale_price.toLocaleString()}</small>
            </div>
            <button class="btn-add-small">+</button>
        </div>
    `).join('');
}

async function addProductByBarcodeOrName(query) {
    const byBarcode = allProducts.find(p => p.barcode === query);
    if (byBarcode) {
        addProductToCart(byBarcode.id, byBarcode.name, byBarcode.sale_price, byBarcode.stock);
        return;
    }

    const byName = allProducts.find(p =>
        p.name.toLowerCase() === query.toLowerCase()
    );
    if (byName) {
        addProductToCart(byName.id, byName.name, byName.sale_price, byName.stock);
        return;
    }

    alert('Producto no encontrado');
}

window.addProductToCart = function (productId, name, price, stock) {
    const existingItem = saleItems.find(item => item.productId === productId);

    if (existingItem) {
        if (existingItem.quantity >= stock) {
            alert(`Stock insuficiente. Solo hay ${stock} unidades disponibles.`);
            return;
        }
        existingItem.quantity++;
    } else {
        if (stock <= 0) {
            alert('Producto sin stock disponible');
            return;
        }
        saleItems.push({
            productId,
            name,
            price,
            quantity: 1,
            maxStock: stock
        });
    }

    updateSaleDisplay();
    document.getElementById('product-suggestions').innerHTML = '';
    document.getElementById('barcode-input').value = '';
};

window.updateQuantity = function (productId, change) {
    const item = saleItems.find(i => i.productId === productId);
    if (!item) return;

    const newQuantity = item.quantity + change;

    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    if (newQuantity > item.maxStock) {
        alert(`Stock insuficiente. Solo hay ${item.maxStock} unidades disponibles.`);
        return;
    }

    item.quantity = newQuantity;
    updateSaleDisplay();
};

window.removeFromCart = function (productId) {
    saleItems = saleItems.filter(item => item.productId !== productId);
    updateSaleDisplay();
};

function clearCart() {
    if (saleItems.length === 0) return;

    if (confirm('¿Limpiar todo el carrito?')) {
        saleItems = [];
        updateSaleDisplay();
    }
}

function calculateTotals() {
    const total = saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    currentTotal = total;
    const totalElement = document.getElementById('sale-total');
    if (totalElement) {
        totalElement.textContent = currentTotal.toLocaleString();
    }
}

function updateSaleDisplay() {
    const container = document.getElementById('sale-items');
    if (!container) {
        console.warn('sale-items element not found');
        return;
    }

    if (saleItems.length === 0) {
        container.innerHTML = '<p class="empty-cart">🛒 Carrito vacío. Agrega productos para comenzar.</p>';
    } else {
        container.innerHTML = saleItems.map((item) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <strong>${item.name}</strong>
                    <small>${item.price.toLocaleString()} c/u</small>
                </div>
                <div class="cart-item-controls">
                    <button class="btn-qty" onclick="updateQuantity(${item.productId}, -1)">−</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="btn-qty" onclick="updateQuantity(${item.productId}, 1)">+</button>
                    <span class="item-subtotal">${(item.price * item.quantity).toLocaleString()}</span>
                    <button class="btn-remove" onclick="removeFromCart(${item.productId})">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    calculateTotals();
}


async function completeSale() {
    if (saleItems.length === 0) {
        alert('Agregue productos a la venta');
        return;
    }

    const paymentType = document.getElementById('payment-type').value;
    const customerId = document.getElementById('customer-select').value || null;

    if ((paymentType === 'fiado' || paymentType === 'mixto') && !customerId) {
        alert('Seleccione un cliente para venta fiada o mixta');
        return;
    }

    let cashAmount = 0;
    let creditAmount = 0;

    if (paymentType === 'mixto') {
        cashAmount = parseFloat(document.getElementById('cash-amount').value) || 0;
        creditAmount = parseFloat(document.getElementById('credit-amount').value) || 0;

        if (cashAmount + creditAmount !== currentTotal) {
            alert('La suma de efectivo y fiado debe ser igual al total');
            return;
        }
    }

    try {
        const res = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: saleItems,
                paymentType,
                customerId,
                cashAmount: paymentType === 'mixto' ? cashAmount : undefined,
                creditAmount: paymentType === 'mixto' ? creditAmount : undefined
            })
        });

        if (res.ok) {
            const data = await res.json();
            lastSaleId = data.saleId;

            saleItems = [];
            updateSaleDisplay();
            loadDashboard();

            // Mostrar modal de éxito
            const successModal = document.getElementById('sale-success-modal');
            if (successModal) {
                successModal.classList.remove('hidden');
            } else {
                alert('✅ Venta completada exitosamente');
            }
        } else {
            const error = await res.json();
            alert(`Error: ${error.error || 'No se pudo completar la venta'}`);
        }
    } catch (error) {
        console.error('Error al completar venta:', error);
        alert('Error al completar venta. Verifique su conexión.');
    }
}

function initSalesEventListeners() {
    const paymentType = document.getElementById('payment-type');
    const customerSelect = document.getElementById('customer-select');
    const mixedPaymentSection = document.getElementById('mixed-payment-section');
    const multiplePaymentSection = document.getElementById('multiple-payment-section');
    const barcodeInput = document.getElementById('barcode-input');
    const cashAmount = document.getElementById('cash-amount');
    const creditAmount = document.getElementById('credit-amount');
    const completeSaleBtn = document.getElementById('complete-sale-btn');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const printTicketBtn = document.getElementById('print-ticket-btn');
    const closeSuccessModal = document.getElementById('close-success-modal');

    if (!paymentType || !customerSelect || !mixedPaymentSection || !barcodeInput) {
        console.error('Sales elements not found');
        return;
    }

    paymentType.addEventListener('change', () => {
        mixedPaymentSection.classList.add('hidden');
        if (multiplePaymentSection) multiplePaymentSection.classList.add('hidden');
        customerSelect.classList.add('hidden');

        if (paymentType.value === 'fiado' || paymentType.value === 'mixto' || paymentType.value === 'multiple') {
            customerSelect.classList.remove('hidden');
            loadCustomersForSale();
        }

        if (paymentType.value === 'mixto') {
            mixedPaymentSection.classList.remove('hidden');
        }

        if (paymentType.value === 'multiple' && multiplePaymentSection) {
            multiplePaymentSection.classList.remove('hidden');
        }
    });

    // Manejar checkboxes de múltiples métodos de pago
    if (multiplePaymentSection) {
        const checkboxes = multiplePaymentSection.querySelectorAll('.payment-method-check');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const method = e.target.value;
                const input = multiplePaymentSection.querySelector(`[data-method="${method}"]`);
                if (input) {
                    input.disabled = !e.target.checked;
                    if (!e.target.checked) input.value = '';
                    updateMultiplePaymentTotal();
                }
            });
        });

        const amountInputs = multiplePaymentSection.querySelectorAll('.payment-method-amount');
        amountInputs.forEach(input => {
            input.addEventListener('input', updateMultiplePaymentTotal);
        });
    }

    if (cashAmount) {
        cashAmount.addEventListener('input', () => {
            const cash = parseFloat(cashAmount.value) || 0;
            const total = currentTotal;
            if (creditAmount) {
                creditAmount.value = Math.max(0, total - cash).toFixed(2);
            }
        });
    }

    if (creditAmount) {
        creditAmount.addEventListener('input', () => {
            const credit = parseFloat(creditAmount.value) || 0;
            const total = currentTotal;
            if (cashAmount) {
                cashAmount.value = Math.max(0, total - credit).toFixed(2);
            }
        });
    }

    barcodeInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchProducts(e.target.value);
        }, 300);
    });

    barcodeInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) {
                await addProductByBarcodeOrName(query);
                e.target.value = '';
                const suggestions = document.getElementById('product-suggestions');
                if (suggestions) suggestions.innerHTML = '';
            }
        }
    });

    if (completeSaleBtn) {
        completeSaleBtn.addEventListener('click', completeSale);
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }

    if (printTicketBtn) {
        printTicketBtn.addEventListener('click', () => {
            if (lastSaleId) {
                window.open(`${API_URL}/export/ticket/${lastSaleId}`, '_blank');
            }
        });
    }

    if (closeSuccessModal) {
        closeSuccessModal.addEventListener('click', () => {
            const modal = document.getElementById('sale-success-modal');
            if (modal) modal.classList.add('hidden');
        });
    }
}

// ========== REPORTS ==========
function loadReportsView() {
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    document.getElementById('report-start-date').value = firstDay;
    document.getElementById('report-end-date').value = today;

    if (!reportsViewInitialized) {
        reportsViewInitialized = true;
    }
}

function initReportsEventListeners() {
    const generateReportBtn = document.getElementById('generate-report-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const exportExcelBtn = document.getElementById('export-excel-btn');

    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateReports);
    }
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportPDF);
    }
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', exportExcel);
    }
}
// ===== CIERRE DE CAJA =====

function initCashRegisterEventListeners() {
    const openClosingModalBtn = document.getElementById('open-closing-modal-btn');
    const cancelClosingBtn = document.getElementById('cancel-closing-btn');
    const closingForm = document.getElementById('closing-form');
    const actualCashInput = document.getElementById('actual-cash');
    const closingNotes = document.getElementById('closing-notes');
    const notesCounter = document.getElementById('notes-counter');
    const filterClosingsBtn = document.getElementById('filter-closings-btn');
    const closeClosingDetail = document.getElementById('close-closing-detail');
    const exportClosingBtn = document.getElementById('export-closing-btn');

    if (!openClosingModalBtn || !cancelClosingBtn || !closingForm) {
        return; // Elementos solo existen cuando la vista está activa
    }

    openClosingModalBtn.addEventListener('click', async () => {
        await loadDailySummary();
        document.getElementById('closing-modal').classList.remove('hidden');
    });

    cancelClosingBtn.addEventListener('click', () => {
        document.getElementById('closing-modal').classList.add('hidden');
        closingForm.reset();
        document.getElementById('difference-display').classList.add('hidden');
    });

    if (actualCashInput) {
        actualCashInput.addEventListener('input', () => {
            calculateDifference();
        });
    }

    if (closingNotes) {
        closingNotes.addEventListener('input', (e) => {
            const length = e.target.value.length;
            notesCounter.textContent = `${length}/500 caracteres`;
        });
    }

    if (filterClosingsBtn) {
        filterClosingsBtn.addEventListener('click', loadClosingHistory);
    }

    if (closeClosingDetail) {
        closeClosingDetail.addEventListener('click', () => {
            document.getElementById('closing-detail-modal').classList.add('hidden');
        });
    }

    if (exportClosingBtn) {
        exportClosingBtn.addEventListener('click', exportClosing);
    }

    // Modal de venta exitosa
    const closeSuccessModal = document.getElementById('close-success-modal');
    if (closeSuccessModal) {
        closeSuccessModal.addEventListener('click', () => {
            document.getElementById('sale-success-modal').classList.add('hidden');
        });
    }

    closingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createClosing();
    });
}

async function loadDailySummary() {
    try {
        const res = await fetch(`${API_URL}/cash-register/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            currentClosingSummary = await res.json();
            displayDailySummary(currentClosingSummary);
        } else {
            alert('Error al cargar resumen del día');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

function displayDailySummary(summary) {
    const today = new Date().toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('closing-date').textContent = today;
    document.getElementById('expected-cash').textContent = `$${summary.expected_cash.toLocaleString('es-CO')}`;
    document.getElementById('credit-sales').textContent = `$${summary.credit_sales.toLocaleString('es-CO')}`;
    document.getElementById('total-transactions').textContent = summary.total_transactions;
}

function calculateDifference() {
    if (!currentClosingSummary) return;

    const actualCash = parseFloat(document.getElementById('actual-cash').value) || 0;
    const expectedCash = currentClosingSummary.expected_cash;
    const difference = actualCash - expectedCash;

    const display = document.getElementById('difference-display');
    const label = document.getElementById('difference-label');
    const amount = document.getElementById('difference-amount');

    display.classList.remove('hidden', 'faltante', 'sobrante', 'cuadrado');

    if (difference < 0) {
        display.classList.add('faltante');
        label.textContent = '⚠️ Faltante';
        amount.textContent = `$${Math.abs(difference).toLocaleString('es-CO')}`;
    } else if (difference > 0) {
        display.classList.add('sobrante');
        label.textContent = '✅ Sobrante';
        amount.textContent = `$${difference.toLocaleString('es-CO')}`;
    } else {
        display.classList.add('cuadrado');
        label.textContent = '✅ Cuadrado';
        amount.textContent = '$0';
    }
}

async function createClosing() {
    const actualCash = parseFloat(document.getElementById('actual-cash').value);
    const notes = document.getElementById('closing-notes').value.trim();

    if (isNaN(actualCash) || actualCash < 0) {
        alert('Ingrese un monto válido');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/cash-register/close`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ actual_cash: actualCash, notes })
        });

        if (res.ok) {
            alert('✅ Cierre de caja completado exitosamente');
            document.getElementById('closing-modal').classList.add('hidden');
            document.getElementById('closing-form').reset();
            document.getElementById('difference-display').classList.add('hidden');
            loadClosingHistory();
        } else {
            const error = await res.json();
            alert(error.message || 'Error al crear cierre de caja');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

async function loadClosingHistory() {
    try {
        const startDate = document.getElementById('closing-start-date').value;
        const endDate = document.getElementById('closing-end-date').value;

        let url = `${API_URL}/cash-register/history?limit=50`;
        if (startDate) url += `&start_date=${startDate}`;
        if (endDate) url += `&end_date=${endDate}`;

        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            displayClosingHistory(data.closings);
        } else {
            alert('Error al cargar historial');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

function displayClosingHistory(closings) {
    const container = document.getElementById('closings-list');

    if (!closings || closings.length === 0) {
        container.innerHTML = `
            <div class="empty-closings">
                <div class="empty-closings-icon">📋</div>
                <p>No hay cierres registrados</p>
            </div>
        `;
        return;
    }

    const table = `
        <table class="closings-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Efectivo Esperado</th>
                    <th>Efectivo Real</th>
                    <th>Diferencia</th>
                    <th>Notas</th>
                </tr>
            </thead>
            <tbody>
                ${closings.map(closing => {
        const diffClass = closing.difference < 0 ? 'faltante' :
            closing.difference > 0 ? 'sobrante' : 'cuadrado';
        const diffLabel = closing.difference < 0 ? 'Faltante' :
            closing.difference > 0 ? 'Sobrante' : 'Cuadrado';

        return `
                        <tr onclick="showClosingDetail(${closing.id})">
                            <td>${new Date(closing.closing_date).toLocaleDateString('es-CO')}</td>
                            <td>${closing.user_name}</td>
                            <td>$${closing.expected_cash.toLocaleString('es-CO')}</td>
                            <td>$${closing.actual_cash.toLocaleString('es-CO')}</td>
                            <td class="difference-cell ${diffClass}">
                                ${diffLabel}: $${Math.abs(closing.difference).toLocaleString('es-CO')}
                            </td>
                            <td>${closing.notes || '-'}</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

async function showClosingDetail(closingId) {
    try {
        const res = await fetch(`${API_URL}/cash-register/export/${closingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            displayClosingDetail(data);
            document.getElementById('closing-detail-modal').classList.remove('hidden');

            // Guardar ID para exportar
            document.getElementById('export-closing-btn').dataset.closingId = closingId;
        } else {
            alert('Error al cargar detalle del cierre');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

function displayClosingDetail(data) {
    const { store, closing, daily_summary } = data;

    const diffClass = closing.difference < 0 ? 'faltante' :
        closing.difference > 0 ? 'sobrante' : 'cuadrado';
    const diffLabel = closing.difference < 0 ? '⚠️ Faltante' :
        closing.difference > 0 ? '✅ Sobrante' : '✅ Cuadrado';

    const content = `
        <div class="closing-detail-section">
            <h4>🏪 Información de la Tienda</h4>
            <div class="closing-detail-item">
                <span>Nombre:</span>
                <strong>${store.name}</strong>
            </div>
            <div class="closing-detail-item">
                <span>Dirección:</span>
                <strong>${store.address || 'N/A'}</strong>
            </div>
            <div class="closing-detail-item">
                <span>Teléfono:</span>
                <strong>${store.phone || 'N/A'}</strong>
            </div>
        </div>

        <div class="closing-detail-section">
            <h4>📋 Información del Cierre</h4>
            <div class="closing-detail-item">
                <span>Fecha:</span>
                <strong>${new Date(closing.date).toLocaleDateString('es-CO')}</strong>
            </div>
            <div class="closing-detail-item">
                <span>Usuario:</span>
                <strong>${closing.user}</strong>
            </div>
            <div class="closing-detail-item">
                <span>Efectivo Esperado:</span>
                <strong>$${closing.expected_cash.toLocaleString('es-CO')}</strong>
            </div>
            <div class="closing-detail-item">
                <span>Efectivo Real:</span>
                <strong>$${closing.actual_cash.toLocaleString('es-CO')}</strong>
            </div>
            <div class="closing-detail-item">
                <span class="${diffClass}">${diffLabel}:</span>
                <strong class="${diffClass}">$${Math.abs(closing.difference).toLocaleString('es-CO')}</strong>
            </div>
            ${closing.notes ? `
                <div class="closing-detail-item">
                    <span>Notas:</span>
                    <strong>${closing.notes}</strong>
                </div>
            ` : ''}
        </div>

        <div class="closing-detail-section">
            <h4>📊 Resumen del Día</h4>
            <div class="closing-detail-item">
                <span>Ventas en Efectivo:</span>
                <strong>$${daily_summary.cash_sales.toLocaleString('es-CO')}</strong>
            </div>
            <div class="closing-detail-item">
                <span>Ventas a Crédito:</span>
                <strong>$${daily_summary.credit_sales.toLocaleString('es-CO')}</strong>
            </div>
            <div class="closing-detail-item">
                <span>Total Ventas:</span>
                <strong>$${daily_summary.total_sales.toLocaleString('es-CO')}</strong>
            </div>
            <div class="closing-detail-item">
                <span>Total Transacciones:</span>
                <strong>${daily_summary.total_transactions}</strong>
            </div>
        </div>
    `;

    document.getElementById('closing-detail-content').innerHTML = content;
}

async function exportClosing() {
    const closingId = document.getElementById('export-closing-btn').dataset.closingId;

    if (!closingId) {
        alert('Error: No se pudo identificar el cierre');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/cash-register/export/${closingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();

            // Crear y descargar archivo JSON
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cierre-caja-${data.closing.date}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            alert('✅ Reporte exportado exitosamente');
        } else {
            alert('Error al exportar reporte');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

async function loadCashRegisterView() {
    if (!cashRegisterViewInitialized) {
        cashRegisterViewInitialized = true;
    }
    await loadClosingHistory();
}


async function generateReports() {
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;

    if (!startDate || !endDate) {
        alert('Seleccione fechas');
        return;
    }

    const resultsDiv = document.getElementById('report-results');
    resultsDiv.innerHTML = '<p>Cargando...</p>';

    try {
        const salesRes = await fetch(`${API_URL}/reports/sales-by-date?startDate=${startDate}&endDate=${endDate}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const salesData = await salesRes.json();

        const productsRes = await fetch(`${API_URL}/reports/top-products?startDate=${startDate}&endDate=${endDate}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const productsData = await productsRes.json();

        const profitRes = await fetch(`${API_URL}/reports/profit?startDate=${startDate}&endDate=${endDate}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profitData = await profitRes.json();

        const debtorsRes = await fetch(`${API_URL}/reports/top-debtors`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const debtorsData = await debtorsRes.json();

        resultsDiv.innerHTML = `
            <div class="report-card">
                <h3>📊 Resumen de Ventas</h3>
                ${salesData.length > 0 ? salesData.map(s => `
                    <p>${s.date}: ${s.total_sales} ventas - $${s.total_amount.toLocaleString()}</p>
                `).join('') : '<p>No hay ventas en este período</p>'}
            </div>
            
            <div class="report-card">
                <h3>🏆 Productos Más Vendidos</h3>
                ${productsData.length > 0 ? productsData.map((p, i) => `
                    <p>${i + 1}. ${p.name}: ${p.total_quantity} unidades - $${p.total_revenue.toLocaleString()}</p>
                `).join('') : '<p>No hay datos de productos</p>'}
            </div>
            
            <div class="report-card">
                <h3>💰 Ganancia Neta</h3>
                <p>Ingresos: $${(profitData.total_revenue || 0).toLocaleString()}</p>
                <p>Costos: $${(profitData.total_cost || 0).toLocaleString()}</p>
                <p><strong>Ganancia: $${(profitData.net_profit || 0).toLocaleString()}</strong></p>
            </div>
            
            <div class="report-card">
                <h3>⚠️ Clientes con Mayor Deuda</h3>
                ${debtorsData.length > 0 ? debtorsData.map((c, i) => `
                    <p>${i + 1}. ${c.name}: $${c.balance.toLocaleString()}</p>
                `).join('') : '<p>No hay clientes con deuda</p>'}
            </div>
        `;
    } catch (error) {
        resultsDiv.innerHTML = '<p class="error">Error al generar reportes</p>';
    }
}

function exportPDF() {
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;

    if (!startDate || !endDate) {
        alert('Seleccione fechas');
        return;
    }

    // Abrir con token en la URL
    window.open(`${API_URL}/export/pdf/sales?startDate=${startDate}&endDate=${endDate}&token=${token}`, '_blank');
}

function exportExcel() {
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;

    if (!startDate || !endDate) {
        alert('Seleccione fechas');
        return;
    }

    // Abrir con token en la URL
    window.open(`${API_URL}/export/excel/sales?startDate=${startDate}&endDate=${endDate}&token=${token}`, '_blank');
}


// ========== MÚLTIPLES MÉTODOS DE PAGO ==========
function updateMultiplePaymentTotal() {
    const multiplePaymentSection = document.getElementById('multiple-payment-section');
    if (!multiplePaymentSection) return;

    const amountInputs = multiplePaymentSection.querySelectorAll('.payment-method-amount:not(:disabled)');
    let total = 0;
    amountInputs.forEach(input => {
        total += parseFloat(input.value) || 0;
    });

    document.getElementById('multiple-payment-sum').textContent = total.toLocaleString();
    const remaining = Math.max(0, currentTotal - total);
    document.getElementById('multiple-payment-remaining').textContent = remaining.toLocaleString();
}

// ========== DEVOLUCIONES ==========
async function loadReturnsView() {
    if (!returnsViewInitialized) {
        returnsViewInitialized = true;
    }

    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    document.getElementById('returns-start-date').value = firstDay;
    document.getElementById('returns-end-date').value = today;

    await loadReturns();
}

async function loadReturns() {
    try {
        const startDate = document.getElementById('returns-start-date').value;
        const endDate = document.getElementById('returns-end-date').value;

        const res = await fetch(`${API_URL}/returns?startDate=${startDate}&endDate=${endDate}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const returns = await res.json();

        const list = document.getElementById('returns-list');
        if (returns.length === 0) {
            list.innerHTML = '<p class="empty-cart">No hay devoluciones en este período</p>';
            return;
        }

        list.innerHTML = returns.map(r => `
            <div class="returns-list-item">
                <h4>Devolución #${r.id} <span class="return-status completed">Completada</span></h4>
                <p><strong>Fecha:</strong> ${new Date(r.created_at).toLocaleString('es-CO')}</p>
                <p><strong>Cliente:</strong> ${r.customer_name || 'Sin cliente'}</p>
                <p><strong>Total:</strong> $${r.total_amount.toLocaleString()}</p>
                <p><strong>Razón:</strong> ${r.reason}</p>
                <p><strong>Productos:</strong> ${r.items_count} item(s)</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading returns:', error);
    }
}

function switchReturnMode(mode) {
    const saleSection = document.getElementById('sale-search-section');
    const manualSection = document.getElementById('manual-return-section');
    const fromSaleBtn = document.getElementById('return-from-sale-btn');
    const manualBtn = document.getElementById('return-manual-btn');

    if (mode === 'sale') {
        saleSection.classList.remove('hidden');
        manualSection.classList.add('hidden');
        fromSaleBtn.classList.add('active');
        manualBtn.classList.remove('active');
    } else {
        saleSection.classList.add('hidden');
        manualSection.classList.remove('hidden');
        fromSaleBtn.classList.remove('active');
        manualBtn.classList.add('active');
    }

    returnItems = [];
    selectedSaleId = null;
    updateReturnDisplay();
}

async function searchSales() {
    const saleId = document.getElementById('search-sale-id').value;
    const date = document.getElementById('search-sale-date').value;
    const customerId = document.getElementById('return-customer-select').value;

    let url = `${API_URL}/returns/search-sales?`;
    if (saleId) url += `saleId=${saleId}&`;
    if (customerId) url += `customerId=${customerId}&`;
    if (date) {
        url += `startDate=${date}&endDate=${date}&`;
    }

    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const sales = await res.json();
            displaySalesResults(sales);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al buscar facturas');
    }
}

function displaySalesResults(sales) {
    const container = document.getElementById('sales-results');

    if (sales.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-secondary)">No se encontraron facturas</p>';
        return;
    }

    container.innerHTML = sales.map(sale => `
        <div class="sale-result-item" onclick="selectSale(${sale.id})">
            <div class="sale-result-header">
                <span class="sale-result-id">Factura #${sale.id}</span>
                <span class="sale-result-total">$${sale.total.toLocaleString('es-CO')}</span>
            </div>
            <div class="sale-result-info">
                ${new Date(sale.created_at).toLocaleString('es-CO')} • 
                ${sale.customer_name || 'Sin cliente'} • 
                ${sale.items_count} productos
            </div>
        </div>
    `).join('');
}

async function selectSale(saleId) {
    try {
        const res = await fetch(`${API_URL}/returns/sale-items/${saleId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const items = await res.json();
            selectedSaleId = saleId;
            displaySaleItems(items);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar productos de la factura');
    }
}

function displaySaleItems(items) {
    returnItems = [];
    const container = document.getElementById('return-items-list');

    container.innerHTML = `
        <h4>Seleccione productos a devolver:</h4>
        ${items.map(item => `
            <div class="sale-item-checkbox">
                <input type="checkbox" id="item-${item.product_id}" 
                       onchange="toggleSaleItem(${item.product_id}, '${item.product_name}', ${item.unit_price}, ${item.quantity})">
                <div class="sale-item-info">
                    <span>${item.product_name}</span>
                    <span>${item.quantity} x $${item.unit_price.toLocaleString('es-CO')}</span>
                </div>
                <input type="number" id="qty-${item.product_id}" 
                       class="sale-item-qty-input" 
                       min="1" max="${item.quantity}" 
                       value="${item.quantity}" 
                       disabled>
            </div>
        `).join('')}
    `;
}

function toggleSaleItem(productId, productName, unitPrice, maxQty) {
    const checkbox = document.getElementById(`item-${productId}`);
    const qtyInput = document.getElementById(`qty-${productId}`);

    qtyInput.disabled = !checkbox.checked;

    if (checkbox.checked) {
        const quantity = parseInt(qtyInput.value) || maxQty;
        returnItems.push({
            productId,
            name: productName,
            price: unitPrice,
            quantity
        });
    } else {
        returnItems = returnItems.filter(item => item.productId !== productId);
    }

    updateReturnDisplay();
}

function initReturnsEventListeners() {
    const addReturnBtn = document.getElementById('add-return-btn');
    const cancelReturnBtn = document.getElementById('cancel-return-btn');
    const returnForm = document.getElementById('return-form');
    const filterReturnsBtn = document.getElementById('filter-returns-btn');
    const returnProductSearch = document.getElementById('return-product-search');
    const returnFromSaleBtn = document.getElementById('return-from-sale-btn');
    const returnManualBtn = document.getElementById('return-manual-btn');
    const searchSalesBtn = document.getElementById('search-sales-btn');

    if (!addReturnBtn || !cancelReturnBtn || !returnForm) {
        return; // Elementos solo existen cuando la vista está activa
    }

    addReturnBtn.addEventListener('click', async () => {
        await loadAllProductsForSale();
        await loadCustomersForReturn();
        returnItems = [];
        selectedSaleId = null;
        updateReturnDisplay();
        document.getElementById('return-reason').value = '';
        document.getElementById('return-modal').classList.remove('hidden');
        switchReturnMode('manual');
    });

    cancelReturnBtn.addEventListener('click', () => {
        document.getElementById('return-modal').classList.add('hidden');
    });

    if (returnFromSaleBtn) {
        returnFromSaleBtn.addEventListener('click', () => switchReturnMode('sale'));
    }

    if (returnManualBtn) {
        returnManualBtn.addEventListener('click', () => switchReturnMode('manual'));
    }

    if (searchSalesBtn) {
        searchSalesBtn.addEventListener('click', searchSales);
    }

    if (filterReturnsBtn) {
        filterReturnsBtn.addEventListener('click', loadReturns);
    }

    if (returnProductSearch) {
        returnProductSearch.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchProductsForReturn(e.target.value);
            }, 300);
        });
    }

    returnForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await processReturn();
    });
}

async function loadCustomersForReturn() {
    const res = await fetch(`${API_URL}/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const customers = await res.json();

    const select = document.getElementById('return-customer-select');
    if (!select) {
        console.warn('return-customer-select element not found');
        return;
    }

    select.innerHTML = '<option value="">Cliente (opcional)</option>' +
        customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function searchProductsForReturn(query) {
    const suggestions = document.getElementById('return-product-suggestions');

    if (!query || query.length < 2) {
        suggestions.innerHTML = '';
        return;
    }

    const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.barcode && p.barcode.includes(query))
    ).slice(0, 5);

    if (filtered.length === 0) {
        suggestions.innerHTML = '<div class="suggestion-item">No se encontraron productos</div>';
        return;
    }

    suggestions.innerHTML = filtered.map(p => `
        <div class="suggestion-item" onclick="addProductToReturn(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.sale_price})">
            <div class="suggestion-info">
                <strong>${p.name}</strong>
                <small>${p.sale_price.toLocaleString()}</small>
            </div>
            <button class="btn-add-small">+</button>
        </div>
    `).join('');
}

window.addProductToReturn = function (productId, name, price) {
    const existingItem = returnItems.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        returnItems.push({
            productId,
            name,
            price,
            quantity: 1
        });
    }

    updateReturnDisplay();
    document.getElementById('return-product-suggestions').innerHTML = '';
    document.getElementById('return-product-search').value = '';
};

window.updateReturnQuantity = function (productId, change) {
    const item = returnItems.find(i => i.productId === productId);
    if (!item) return;

    const newQuantity = item.quantity + change;

    if (newQuantity <= 0) {
        removeFromReturn(productId);
        return;
    }

    item.quantity = newQuantity;
    updateReturnDisplay();
};

window.removeFromReturn = function (productId) {
    returnItems = returnItems.filter(item => item.productId !== productId);
    updateReturnDisplay();
};

function updateReturnDisplay() {
    const container = document.getElementById('return-items-list');
    if (!container) {
        console.warn('return-items-list element not found');
        return;
    }

    if (returnItems.length === 0) {
        container.innerHTML = '<p class="empty-cart">No hay productos agregados</p>';
    } else {
        container.innerHTML = returnItems.map((item) => `
            <div class="return-item">
                <div class="return-item-info">
                    <strong>${item.name}</strong>
                    <small>${item.price.toLocaleString()} c/u</small>
                </div>
                <div class="return-item-controls">
                    <button class="btn-qty" onclick="updateReturnQuantity(${item.productId}, -1)">−</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="btn-qty" onclick="updateReturnQuantity(${item.productId}, 1)">+</button>
                    <span class="item-subtotal">${(item.price * item.quantity).toLocaleString()}</span>
                    <button class="btn-remove" onclick="removeFromReturn(${item.productId})">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    const total = returnItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalElement = document.getElementById('return-total-amount');
    if (totalElement) {
        totalElement.textContent = total.toLocaleString();
    }
}

async function processReturn() {
    if (returnItems.length === 0) {
        alert('Agregue productos a la devolución');
        return;
    }

    const reason = document.getElementById('return-reason').value;
    const customerId = document.getElementById('return-customer-select').value || null;

    if (!reason) {
        alert('Ingrese la razón de la devolución');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/returns`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                saleId: selectedSaleId,
                items: returnItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.price
                })),
                reason,
                customerId
            })
        });

        if (res.ok) {
            document.getElementById('return-modal').classList.add('hidden');
            alert('Devolución procesada exitosamente');
            loadReturns();
            loadDashboard();
        } else {
            const error = await res.json();
            alert(error.error || 'Error al procesar devolución');
        }
    } catch (error) {
        alert('Error de conexión');
    }
}

function switchReturnMode(mode) {
    const saleSection = document.getElementById('sale-search-section');
    const manualSection = document.getElementById('manual-return-section');
    const fromSaleBtn = document.getElementById('return-from-sale-btn');
    const manualBtn = document.getElementById('return-manual-btn');

    if (mode === 'sale') {
        saleSection.classList.remove('hidden');
        manualSection.classList.add('hidden');
        fromSaleBtn.classList.add('active');
        manualBtn.classList.remove('active');
    } else {
        saleSection.classList.add('hidden');
        manualSection.classList.remove('hidden');
        fromSaleBtn.classList.remove('active');
        manualBtn.classList.add('active');
    }

    returnItems = [];
    selectedSaleId = null;
    updateReturnDisplay();
}

async function searchSales() {
    const saleId = document.getElementById('search-sale-id').value;
    const date = document.getElementById('search-sale-date').value;
    const customerId = document.getElementById('return-customer-select').value;

    let url = `${API_URL}/returns/search-sales?`;
    if (saleId) url += `saleId=${saleId}&`;
    if (customerId) url += `customerId=${customerId}&`;
    if (date) {
        url += `startDate=${date}&endDate=${date}&`;
    }

    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const sales = await res.json();
            displaySalesResults(sales);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al buscar facturas');
    }
}

function displaySalesResults(sales) {
    const container = document.getElementById('sales-results');

    if (sales.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-secondary)">No se encontraron facturas</p>';
        return;
    }

    container.innerHTML = sales.map(sale => `
        <div class="sale-result-item" onclick="selectSale(${sale.id})">
            <div class="sale-result-header">
                <span class="sale-result-id">Factura #${sale.id}</span>
                <span class="sale-result-total">$${sale.total.toLocaleString('es-CO')}</span>
            </div>
            <div class="sale-result-info">
                ${new Date(sale.created_at).toLocaleString('es-CO')} • 
                ${sale.customer_name || 'Sin cliente'} • 
                ${sale.items_count} productos
            </div>
        </div>
    `).join('');
}

async function selectSale(saleId) {
    try {
        const res = await fetch(`${API_URL}/returns/sale-items/${saleId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const items = await res.json();
            selectedSaleId = saleId;
            displaySaleItems(items);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar productos de la factura');
    }
}

function displaySaleItems(items) {
    returnItems = [];
    const container = document.getElementById('return-items-list');

    container.innerHTML = `
        <h4>Seleccione productos a devolver:</h4>
        ${items.map(item => `
            <div class="sale-item-checkbox">
                <input type="checkbox" id="item-${item.product_id}" 
                       onchange="toggleSaleItem(${item.product_id}, '${item.product_name}', ${item.unit_price}, ${item.quantity})">
                <div class="sale-item-info">
                    <span>${item.product_name}</span>
                    <span>${item.quantity} x $${item.unit_price.toLocaleString('es-CO')}</span>
                </div>
                <input type="number" id="qty-${item.product_id}" 
                       class="sale-item-qty-input" 
                       min="1" max="${item.quantity}" 
                       value="${item.quantity}" 
                       disabled>
            </div>
        `).join('')}
    `;
}

function toggleSaleItem(productId, productName, unitPrice, maxQty) {
    const checkbox = document.getElementById(`item-${productId}`);
    const qtyInput = document.getElementById(`qty-${productId}`);

    qtyInput.disabled = !checkbox.checked;

    if (checkbox.checked) {
        const quantity = parseInt(qtyInput.value) || maxQty;
        returnItems.push({
            productId,
            name: productName,
            price: unitPrice,
            quantity
        });
    } else {
        returnItems = returnItems.filter(item => item.productId !== productId);
    }

    updateReturnDisplay();
}


// ========== HISTORIAL DE FACTURAS ==========
async function loadInvoicesView() {
    if (!invoicesViewInitialized) {
        invoicesViewInitialized = true;
    }

    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    document.getElementById('invoices-start-date').value = firstDay;
    document.getElementById('invoices-end-date').value = today;

    await loadInvoices();
}

async function loadInvoices() {
    try {
        const startDate = document.getElementById('invoices-start-date').value;
        const endDate = document.getElementById('invoices-end-date').value;

        let url = `${API_URL}/sales`;
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }

        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const invoices = await res.json();

        // Calcular estadísticas
        const stats = {
            total: invoices.length,
            totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
            efectivo: invoices.filter(inv => inv.payment_type === 'efectivo').length,
            fiado: invoices.filter(inv => inv.payment_type === 'fiado').length,
            mixto: invoices.filter(inv => inv.payment_type === 'mixto').length
        };

        // Mostrar estadísticas
        const statsDiv = document.getElementById('invoices-stats');
        statsDiv.innerHTML = `
            <div class="invoice-stat-card">
                <h4>Total Facturas</h4>
                <div class="stat-value">${stats.total}</div>
            </div>
            <div class="invoice-stat-card">
                <h4>Monto Total</h4>
                <div class="stat-value">$${stats.totalAmount.toLocaleString()}</div>
            </div>
            <div class="invoice-stat-card">
                <h4>Efectivo</h4>
                <div class="stat-value">${stats.efectivo}</div>
            </div>
            <div class="invoice-stat-card">
                <h4>Fiado</h4>
                <div class="stat-value">${stats.fiado}</div>
            </div>
            <div class="invoice-stat-card">
                <h4>Mixto</h4>
                <div class="stat-value">${stats.mixto}</div>
            </div>
        `;

        // Mostrar lista de facturas
        const list = document.getElementById('invoices-list');
        if (invoices.length === 0) {
            list.innerHTML = `
                <div class="empty-invoices">
                    <div class="empty-invoices-icon">📄</div>
                    <p>No hay facturas en este período</p>
                </div>
            `;
            return;
        }

        list.innerHTML = invoices.map(inv => {
            const date = new Date(inv.created_at);
            const formattedDate = date.toLocaleString('es-CO', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="invoice-item" onclick="viewInvoiceDetail(${inv.id})">
                    <div class="invoice-item-header">
                        <div class="invoice-number">Factura #${inv.id}</div>
                        <div class="invoice-date">${formattedDate}</div>
                    </div>
                    <div class="invoice-item-body">
                        <div class="invoice-info-item">
                            <div class="invoice-info-label">Cliente</div>
                            <div class="invoice-info-value">${inv.customer_name || 'Cliente General'}</div>
                        </div>
                        <div class="invoice-info-item">
                            <div class="invoice-info-label">Vendedor</div>
                            <div class="invoice-info-value">${inv.user_name}</div>
                        </div>
                        <div class="invoice-info-item">
                            <div class="invoice-info-label">Método de Pago</div>
                            <div class="invoice-info-value">
                                <span class="invoice-payment-badge ${inv.payment_type}">
                                    ${inv.payment_type === 'efectivo' ? '💵 Efectivo' :
                    inv.payment_type === 'fiado' ? '📝 Fiado' :
                        '💵📝 Mixto'}
                                </span>
                            </div>
                        </div>
                        ${inv.payment_type === 'mixto' ? `
                            <div class="invoice-info-item">
                                <div class="invoice-info-label">Desglose</div>
                                <div class="invoice-info-value">
                                    💵 $${inv.cash_amount.toLocaleString()} | 
                                    📝 $${inv.credit_amount.toLocaleString()}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="invoice-item-footer">
                        <div class="invoice-total">$${inv.total.toLocaleString()}</div>
                        <button class="btn-small btn-primary" onclick="event.stopPropagation(); viewInvoiceDetail(${inv.id})">
                            Ver Detalle →
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading invoices:', error);
        alert('Error al cargar facturas');
    }
}

window.viewInvoiceDetail = async function (invoiceId) {
    try {
        const res = await fetch(`${API_URL}/sales/${invoiceId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const invoice = await res.json();

        const date = new Date(invoice.created_at);
        const formattedDate = date.toLocaleString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const content = document.getElementById('invoice-detail-content');
        content.innerHTML = `
            <div class="invoice-detail-section">
                <h4>📋 Información General</h4>
                <div class="invoice-detail-grid">
                    <div class="invoice-detail-item">
                        <div class="invoice-detail-label">Número de Factura</div>
                        <div class="invoice-detail-value">#${invoice.id}</div>
                    </div>
                    <div class="invoice-detail-item">
                        <div class="invoice-detail-label">Fecha y Hora</div>
                        <div class="invoice-detail-value">${formattedDate}</div>
                    </div>
                    <div class="invoice-detail-item">
                        <div class="invoice-detail-label">Cliente</div>
                        <div class="invoice-detail-value">${invoice.customer_name || 'Cliente General'}</div>
                    </div>
                    <div class="invoice-detail-item">
                        <div class="invoice-detail-label">Vendedor</div>
                        <div class="invoice-detail-value">${invoice.user_name}</div>
                    </div>
                    <div class="invoice-detail-item">
                        <div class="invoice-detail-label">Método de Pago</div>
                        <div class="invoice-detail-value">
                            <span class="invoice-payment-badge ${invoice.payment_type}">
                                ${invoice.payment_type === 'efectivo' ? '💵 Efectivo' :
                invoice.payment_type === 'fiado' ? '📝 Fiado' :
                    '💵📝 Mixto'}
                            </span>
                        </div>
                    </div>
                    ${invoice.payment_type === 'mixto' ? `
                        <div class="invoice-detail-item">
                            <div class="invoice-detail-label">Desglose de Pago</div>
                            <div class="invoice-detail-value">
                                💵 Efectivo: $${invoice.cash_amount.toLocaleString()}<br>
                                📝 Fiado: $${invoice.credit_amount.toLocaleString()}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="invoice-detail-section">
                <h4>🛒 Productos</h4>
                <table class="invoice-products-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                            <tr>
                                <td><strong>${item.product_name}</strong></td>
                                <td>${item.quantity}</td>
                                <td>$${item.unit_price.toLocaleString()}</td>
                                <td>$${item.subtotal.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="invoice-totals">
                <div class="invoice-totals-row">
                    <span>Subtotal:</span>
                    <span>$${invoice.subtotal.toLocaleString()}</span>
                </div>
                ${invoice.discount > 0 ? `
                    <div class="invoice-totals-row">
                        <span>Descuento:</span>
                        <span>-$${invoice.discount.toLocaleString()}</span>
                    </div>
                ` : ''}
                <div class="invoice-totals-row total">
                    <span>TOTAL:</span>
                    <span>$${invoice.total.toLocaleString()}</span>
                </div>
            </div>
        `;

        // Guardar ID para imprimir
        document.getElementById('print-invoice-btn').onclick = () => {
            window.open(`${API_URL}/export/ticket/${invoiceId}`, '_blank');
        };

        document.getElementById('invoice-detail-modal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading invoice detail:', error);
        alert('Error al cargar detalle de factura');
    }
};

function initInvoicesEventListeners() {
    const filterInvoicesBtn = document.getElementById('filter-invoices-btn');
    const clearInvoicesFilterBtn = document.getElementById('clear-invoices-filter-btn');
    const closeInvoiceModal = document.getElementById('close-invoice-modal');
    const closeInvoiceDetail = document.getElementById('close-invoice-detail');

    if (filterInvoicesBtn) {
        filterInvoicesBtn.addEventListener('click', loadInvoices);
    }

    if (clearInvoicesFilterBtn) {
        clearInvoicesFilterBtn.addEventListener('click', () => {
            const today = new Date().toISOString().split('T')[0];
            const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

            document.getElementById('invoices-start-date').value = firstDay;
            document.getElementById('invoices-end-date').value = today;
            loadInvoices();
        });
    }

    if (closeInvoiceModal) {
        closeInvoiceModal.addEventListener('click', () => {
            document.getElementById('invoice-detail-modal').classList.add('hidden');
        });
    }

    if (closeInvoiceDetail) {
        closeInvoiceDetail.addEventListener('click', () => {
            document.getElementById('invoice-detail-modal').classList.add('hidden');
        });
    }
}

// Función para cerrar modal de pago
window.closePaymentModal = () => {
    document.getElementById('payment-modal').classList.add('hidden');
    document.getElementById('payment-form').reset();
};
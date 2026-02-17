// Módulo de ventas
import { state, getToken } from './state.js';

const API_URL = window.CONFIG?.API_URL || 'http://localhost:3000/api';

export async function loadAllProductsForSale() {
    try {
        const res = await fetch(`${API_URL}/products`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        state.allProducts = await res.json();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

export async function loadSalesView() {
    if (!state.salesViewInitialized) {
        state.salesViewInitialized = true;
    }
    await loadAllProductsForSale();
    updateSaleDisplay();
}

async function loadCustomersForSale() {
    const res = await fetch(`${API_URL}/customers`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const customers = await res.json();

    const select = document.getElementById('customer-select');
    select.innerHTML = '<option value="">Seleccionar cliente</option>' +
        customers.map(c => `<option value="${c.id}">${c.name}${c.balance > 0 ? ' (Debe: ' + c.balance.toLocaleString() + ')' : ''}</option>`).join('');
}

function searchProducts(query) {
    const suggestions = document.getElementById('product-suggestions');

    if (!query || query.length < 2) {
        suggestions.innerHTML = '';
        return;
    }

    const filtered = state.allProducts.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.barcode && p.barcode.includes(query))
    ).slice(0, 5);

    if (filtered.length === 0) {
        suggestions.innerHTML = '<div class="suggestion-item">No se encontraron productos</div>';
        return;
    }

    suggestions.innerHTML = filtered.map(p => `
        <div class="suggestion-item" onclick="window.addProductToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.sale_price}, ${p.stock})">
            <div class="suggestion-info">
                <strong>${p.name}</strong>
                <small>Stock: ${p.stock} | ${p.sale_price.toLocaleString()}</small>
            </div>
            <button class="btn-add-small">+</button>
        </div>
    `).join('');
}

async function addProductByBarcodeOrName(query) {
    const byBarcode = state.allProducts.find(p => p.barcode === query);
    if (byBarcode) {
        window.addProductToCart(byBarcode.id, byBarcode.name, byBarcode.sale_price, byBarcode.stock);
        return;
    }

    const byName = state.allProducts.find(p =>
        p.name.toLowerCase() === query.toLowerCase()
    );
    if (byName) {
        window.addProductToCart(byName.id, byName.name, byName.sale_price, byName.stock);
        return;
    }

    alert('Producto no encontrado');
}

function calculateTotals() {
    const total = state.saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    state.currentTotal = total;
    document.getElementById('sale-total').textContent = state.currentTotal.toLocaleString();
}

function updateSaleDisplay() {
    const container = document.getElementById('sale-items');

    if (state.saleItems.length === 0) {
        container.innerHTML = '<p class="empty-cart">🛒 Carrito vacío. Agrega productos para comenzar.</p>';
    } else {
        container.innerHTML = state.saleItems.map((item) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <strong>${item.name}</strong>
                    <small>${item.price.toLocaleString()} c/u</small>
                </div>
                <div class="cart-item-controls">
                    <button class="btn-qty" onclick="window.updateQuantity(${item.productId}, -1)">−</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="btn-qty" onclick="window.updateQuantity(${item.productId}, 1)">+</button>
                    <span class="item-subtotal">${(item.price * item.quantity).toLocaleString()}</span>
                    <button class="btn-remove" onclick="window.removeFromCart(${item.productId})">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    calculateTotals();
}

function clearCart() {
    if (state.saleItems.length === 0) return;

    if (confirm('¿Limpiar todo el carrito?')) {
        state.saleItems = [];
        updateSaleDisplay();
    }
}

async function completeSale() {
    if (state.saleItems.length === 0) {
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

        if (cashAmount + creditAmount !== state.currentTotal) {
            alert('La suma de efectivo y fiado debe ser igual al total');
            return;
        }
    }

    try {
        const res = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: state.saleItems,
                paymentType,
                customerId,
                cashAmount: paymentType === 'mixto' ? cashAmount : undefined,
                creditAmount: paymentType === 'mixto' ? creditAmount : undefined
            })
        });

        if (res.ok) {
            const data = await res.json();
            state.lastSaleId = data.saleId;

            state.saleItems = [];
            updateSaleDisplay();

            if (typeof window.loadDashboard === 'function') {
                window.loadDashboard();
            }

            document.getElementById('sale-success-modal').classList.remove('hidden');
        } else {
            const error = await res.json();
            alert(error.error);
        }
    } catch (error) {
        alert('Error al completar venta');
    }
}

export function initSalesEventListeners() {
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

    if (cashAmount) {
        cashAmount.addEventListener('input', () => {
            const cash = parseFloat(cashAmount.value) || 0;
            const total = state.currentTotal;
            if (creditAmount) {
                creditAmount.value = Math.max(0, total - cash).toFixed(2);
            }
        });
    }

    if (creditAmount) {
        creditAmount.addEventListener('input', () => {
            const credit = parseFloat(creditAmount.value) || 0;
            const total = state.currentTotal;
            if (cashAmount) {
                cashAmount.value = Math.max(0, total - credit).toFixed(2);
            }
        });
    }

    barcodeInput.addEventListener('input', (e) => {
        clearTimeout(state.searchTimeout);
        state.searchTimeout = setTimeout(() => {
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
            if (state.lastSaleId) {
                window.open(`${API_URL}/export/ticket/${state.lastSaleId}`, '_blank');
            }
        });
    }

    if (closeSuccessModal) {
        closeSuccessModal.addEventListener('click', () => {
            const modal = document.getElementById('sale-success-modal');
            if (modal) modal.classList.add('hidden');
        });
    }

    // Funciones globales para el carrito
    window.addProductToCart = function (productId, name, price, stock) {
        const existingItem = state.saleItems.find(item => item.productId === productId);

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
            state.saleItems.push({
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
        const item = state.saleItems.find(i => i.productId === productId);
        if (!item) return;

        const newQuantity = item.quantity + change;

        if (newQuantity <= 0) {
            window.removeFromCart(productId);
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
        state.saleItems = state.saleItems.filter(item => item.productId !== productId);
        updateSaleDisplay();
    };
}

// ========== MANEJADORES DE MODALES ==========
// Event listeners para todos los modales del sistema

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Inicializando manejadores de modales...');

    // ===== MODAL DE PRODUCTOS =====
    const addProductBtn = document.getElementById('add-product-btn');
    const cancelProductBtn = document.getElementById('cancel-product-btn');
    const productModal = document.getElementById('product-modal');

    if (addProductBtn) {
        addProductBtn.addEventListener('click', async () => {
            console.log('✅ Click en agregar producto');
            // Cargar categorías
            try {
                const token = localStorage.getItem('token');
                const API_URL = window.CONFIG?.API_URL || window.API_URL || '/api';

                // Intentar múltiples endpoints por si hay bloqueo de ad blocker
                let res;
                try {
                    res = await fetch(`${API_URL}/categories`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                } catch (firstError) {
                    console.warn('Primer intento falló, probando ruta alternativa:', firstError);
                    // Intentar con ruta alternativa
                    res = await fetch(`${API_URL}/inventory/categories`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                }

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }

                const categories = await res.json();

                const select = document.getElementById('product-category');
                if (select) {
                    select.innerHTML = '<option value="">Sin categoría</option>' +
                        categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
                }
            } catch (error) {
                console.error('Error cargando categorías:', error);
            }

            const modalTitle = document.getElementById('product-modal-title');
            const productForm = document.getElementById('product-form');
            const productId = document.getElementById('product-id');

            if (modalTitle) modalTitle.textContent = 'Agregar Producto';
            if (productForm) productForm.reset();
            if (productId) productId.value = '';
            if (productModal) productModal.classList.remove('hidden');
        });
    }

    if (cancelProductBtn) {
        cancelProductBtn.addEventListener('click', () => {
            console.log('❌ Cancelar producto');
            if (productModal) productModal.classList.add('hidden');
        });
    }

    // ===== MODAL DE CATEGORÍAS =====
    const addCategoryBtn = document.getElementById('add-category-btn');
    const cancelCategoryBtn = document.getElementById('cancel-category-btn');
    const categoryModal = document.getElementById('category-modal');

    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            console.log('✅ Click en agregar categoría');
            const modalTitle = document.getElementById('category-modal-title');
            const categoryForm = document.getElementById('category-form');
            const categoryId = document.getElementById('category-id');

            if (modalTitle) modalTitle.textContent = 'Agregar Categoría';
            if (categoryForm) categoryForm.reset();
            if (categoryId) categoryId.value = '';
            if (categoryModal) categoryModal.classList.remove('hidden');
        });
    }

    if (cancelCategoryBtn) {
        cancelCategoryBtn.addEventListener('click', () => {
            console.log('❌ Cancelar categoría');
            if (categoryModal) categoryModal.classList.add('hidden');
        });
    }

    // ===== MODAL DE CLIENTES =====
    const addCustomerBtn = document.getElementById('add-customer-btn');
    const cancelCustomerBtn = document.getElementById('cancel-customer-btn');
    const customerModal = document.getElementById('customer-modal');

    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', () => {
            console.log('✅ Click en agregar cliente');
            const modalTitle = document.getElementById('customer-modal-title');
            const customerForm = document.getElementById('customer-form');
            const customerId = document.getElementById('customer-id');

            if (modalTitle) modalTitle.textContent = 'Agregar Cliente';
            if (customerForm) customerForm.reset();
            if (customerId) customerId.value = '';
            if (customerModal) customerModal.classList.remove('hidden');
        });
    }

    if (cancelCustomerBtn) {
        cancelCustomerBtn.addEventListener('click', () => {
            console.log('❌ Cancelar cliente');
            if (customerModal) customerModal.classList.add('hidden');
        });
    }

    // ===== MODAL DE DEVOLUCIONES =====
    const addReturnBtn = document.getElementById('add-return-btn');
    const cancelReturnBtn = document.getElementById('cancel-return-btn');
    const returnModal = document.getElementById('return-modal');

    if (addReturnBtn) {
        addReturnBtn.addEventListener('click', () => {
            console.log('✅ Click en agregar devolución');
            const returnReason = document.getElementById('return-reason');

            if (returnReason) returnReason.value = '';
            if (returnModal) returnModal.classList.remove('hidden');
        });
    }

    if (cancelReturnBtn) {
        cancelReturnBtn.addEventListener('click', () => {
            console.log('❌ Cancelar devolución');
            if (returnModal) returnModal.classList.add('hidden');
        });
    }

    // ===== MODAL DE CIERRE DE CAJA =====
    const openClosingModalBtn = document.getElementById('open-closing-modal-btn');
    const cancelClosingBtn = document.getElementById('cancel-closing-btn');
    const closingModal = document.getElementById('closing-modal');

    if (openClosingModalBtn) {
        openClosingModalBtn.addEventListener('click', async () => {
            console.log('✅ Click en cerrar caja');
            // Cargar resumen del día
            try {
                const token = localStorage.getItem('token');
                const API_URL = window.API_URL || 'http://localhost:3000/api';
                const res = await fetch(`${API_URL}/cash-register/summary`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const summary = await res.json();

                    const today = new Date().toLocaleDateString('es-CO', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    const closingDate = document.getElementById('closing-date');
                    const expectedCash = document.getElementById('expected-cash');
                    const creditSales = document.getElementById('credit-sales');
                    const totalTransactions = document.getElementById('total-transactions');

                    if (closingDate) closingDate.textContent = today;
                    if (expectedCash) expectedCash.textContent = summary.expected_cash.toLocaleString('es-CO');
                    if (creditSales) creditSales.textContent = summary.credit_sales.toLocaleString('es-CO');
                    if (totalTransactions) totalTransactions.textContent = summary.total_transactions;
                }
            } catch (error) {
                console.error('Error cargando resumen:', error);
            }

            if (closingModal) closingModal.classList.remove('hidden');
        });
    }

    if (cancelClosingBtn) {
        cancelClosingBtn.addEventListener('click', () => {
            console.log('❌ Cancelar cierre');
            if (closingModal) closingModal.classList.add('hidden');
        });
    }

    // ===== MODAL DE DETALLE DE FACTURA =====
    const closeInvoiceDetail = document.getElementById('close-invoice-detail');
    const invoiceDetailModal = document.getElementById('invoice-detail-modal');

    if (closeInvoiceDetail) {
        closeInvoiceDetail.addEventListener('click', () => {
            console.log('❌ Cerrar detalle de factura');
            if (invoiceDetailModal) invoiceDetailModal.classList.add('hidden');
        });
    }

    // ===== MODAL DE DETALLE DE CIERRE =====
    const closeClosingDetail = document.getElementById('close-closing-detail');
    const closingDetailModal = document.getElementById('closing-detail-modal');

    if (closeClosingDetail) {
        closeClosingDetail.addEventListener('click', () => {
            console.log('❌ Cerrar detalle de cierre');
            if (closingDetailModal) closingDetailModal.classList.add('hidden');
        });
    }

    console.log('✅ Manejadores de modales inicializados');
});

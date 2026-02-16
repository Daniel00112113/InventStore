// Módulo de productos
import { state, getToken } from './state.js';

const API_URL = window.CONFIG?.API_URL || 'http://localhost:3000/api';

export async function loadProducts() {
    try {
        const endpoint = state.showLowStockOnly ? `${API_URL}/products/low-stock` : `${API_URL}/products`;
        const res = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const products = await res.json();

        const list = document.getElementById('products-list');
        list.innerHTML = products.map(p => `
            <div class="list-item">
                <div>
                    <strong>${p.name}</strong>
                    ${p.stock <= p.min_stock ? '<span class="low-stock-badge">Stock Bajo</span>' : ''}
                    <br>
                    <small>Stock: ${p.stock} | Costo: ${p.cost_price} | Venta: ${p.sale_price}</small>
                </div>
                <div class="item-actions">
                    <button class="btn-small btn-edit" onclick="window.editProduct(${p.id})">Editar</button>
                    <button class="btn-small btn-danger" onclick="window.deleteProduct(${p.id})">Eliminar</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

async function loadCategoriesForSelect() {
    try {
        const res = await fetch(`${API_URL}/categories`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const categories = await res.json();

        const select = document.getElementById('product-category');
        select.innerHTML = '<option value="">Sin categoría</option>' +
            categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

export function initProductsEventListeners() {
    const lowStockFilter = document.getElementById('low-stock-filter');
    const addProductBtn = document.getElementById('add-product-btn');

    if (!lowStockFilter || !addProductBtn) {
        return;
    }

    lowStockFilter.addEventListener('click', () => {
        state.showLowStockOnly = !state.showLowStockOnly;
        lowStockFilter.textContent = state.showLowStockOnly ? 'Ver Todos' : 'Ver Stock Bajo';
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

    const cancelProductBtn = document.getElementById('cancel-product-btn');
    if (cancelProductBtn) {
        cancelProductBtn.addEventListener('click', () => {
            const modal = document.getElementById('product-modal');
            if (modal) modal.classList.add('hidden');
        });
    }

    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('product-id')?.value;
            const data = {
                name: document.getElementById('product-name')?.value,
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
                const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;
                const method = id ? 'PUT' : 'POST';

                const res = await fetch(url, {
                    method,
                    headers: {
                        'Authorization': `Bearer ${getToken()}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    const modal = document.getElementById('product-modal');
                    if (modal) modal.classList.add('hidden');
                    loadProducts();
                } else {
                    alert('Error al guardar producto');
                }
            } catch (error) {
                alert('Error de conexión');
            }
        });
    }

    window.editProduct = async (id) => {
        try {
            await loadCategoriesForSelect();
            const res = await fetch(`${API_URL}/products`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const products = await res.json();
            const product = products.find(p => p.id === id);

            if (product) {
                document.getElementById('product-modal-title').textContent = 'Editar Producto';
                document.getElementById('product-id').value = product.id;
                document.getElementById('product-name').value = product.name;
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
                headers: { 'Authorization': `Bearer ${getToken()}` }
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

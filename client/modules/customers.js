// Módulo de clientes
import { state, getToken } from './state.js';

const API_URL = window.CONFIG?.API_URL || 'http://localhost:3000/api';

export async function loadCustomers() {
    try {
        const endpoint = state.showDebtOnly ? `${API_URL}/customers/with-debt` : `${API_URL}/customers`;
        const res = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const customers = await res.json();

        const list = document.getElementById('customers-list');
        list.innerHTML = customers.map(c => `
            <div class="list-item">
                <div>
                    <strong>${c.name}</strong>
                    ${c.balance > 0 ? `<span class="debt-badge">Debe: ${c.balance.toLocaleString()}</span>` : ''}
                    <br>
                    <small>${c.phone || 'Sin teléfono'} | ${c.address || 'Sin dirección'}</small>
                </div>
                <div class="item-actions">
                    ${c.balance > 0 ? `<button class="btn-small btn-pay" onclick="window.showPaymentModal(${c.id}, '${c.name}', ${c.balance})">Pagar</button>` : ''}
                    <button class="btn-small btn-edit" onclick="window.editCustomer(${c.id})">Editar</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

export function initCustomersEventListeners() {
    const debtFilter = document.getElementById('debt-filter');
    const addCustomerBtn = document.getElementById('add-customer-btn');
    const cancelCustomerBtn = document.getElementById('cancel-customer-btn');
    const customerForm = document.getElementById('customer-form');
    const cancelPaymentBtn = document.getElementById('cancel-payment');
    const paymentForm = document.getElementById('payment-form');

    if (!debtFilter || !addCustomerBtn || !cancelCustomerBtn || !customerForm) {
        return;
    }

    debtFilter.addEventListener('click', () => {
        state.showDebtOnly = !state.showDebtOnly;
        debtFilter.textContent = state.showDebtOnly ? 'Ver Todos' : 'Ver Con Deuda';
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
                    'Authorization': `Bearer ${getToken()}`,
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
                        'Authorization': `Bearer ${getToken()}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ amount })
                });

                if (res.ok) {
                    const modal = document.getElementById('payment-modal');
                    if (modal) modal.classList.add('hidden');
                    loadCustomers();
                    // Recargar dashboard si está disponible
                    if (typeof window.loadDashboard === 'function') {
                        window.loadDashboard();
                    }
                } else {
                    const error = await res.json();
                    alert(error.error);
                }
            } catch (error) {
                alert('Error de conexión');
            }
        });
    }

    window.editCustomer = async (id) => {
        try {
            const res = await fetch(`${API_URL}/customers`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
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
        document.getElementById('payment-customer-balance').textContent = `${balance.toLocaleString()}`;
        document.getElementById('payment-amount').max = balance;
        document.getElementById('payment-modal').classList.remove('hidden');
    };
}

// Módulo de categorías
import { getToken } from './state.js';

const API_URL = window.CONFIG?.API_URL || 'http://localhost:3000/api';

export async function loadCategories() {
    try {
        const res = await fetch(`${API_URL}/categories`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
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
                    <button class="btn-small btn-edit" onclick="window.editCategory(${c.id})">Editar</button>
                    <button class="btn-small btn-danger" onclick="window.deleteCategory(${c.id})">Eliminar</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

export function initCategoriesEventListeners() {
    const addCategoryBtn = document.getElementById('add-category-btn');
    const cancelCategoryBtn = document.getElementById('cancel-category-btn');
    const categoryForm = document.getElementById('category-form');

    if (!addCategoryBtn || !cancelCategoryBtn || !categoryForm) {
        return;
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
                    'Authorization': `Bearer ${getToken()}`,
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

    window.editCategory = async (id) => {
        try {
            const res = await fetch(`${API_URL}/categories`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
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
                headers: { 'Authorization': `Bearer ${getToken()}` }
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
}

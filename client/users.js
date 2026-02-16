// ========== GESTIÓN DE USUARIOS ==========

let currentEditingUserId = null;
let currentUserRole = null;

// Función auxiliar para mostrar notificaciones
function showUserNotification(message, type = 'info') {
    // Si existe una función global de notificaciones, usarla
    if (typeof window.showNotification === 'function') {
        window.showUserNotification(message, type);
        return;
    }

    // Fallback: usar alert
    if (type === 'error') {
        alert('❌ ' + message);
    } else if (type === 'success') {
        alert('✅ ' + message);
    } else {
        alert(message);
    }
}

// Inicializar vista de usuarios
function initUsersView() {
    // Ocultar menú de usuarios si no es admin o gerente
    const userRole = localStorage.getItem('userRole');
    currentUserRole = userRole;

    const usersMenuBtn = document.getElementById('users-menu-btn');
    if (userRole !== 'admin' && userRole !== 'gerente') {
        if (usersMenuBtn) usersMenuBtn.style.display = 'none';
        return;
    }

    // Event listeners con validación
    const addUserBtn = document.getElementById('add-user-btn');
    const cancelUserBtn = document.getElementById('cancel-user-btn');
    const userForm = document.getElementById('user-form');
    const changePasswordCheck = document.getElementById('change-password-check');

    if (addUserBtn) addUserBtn.addEventListener('click', showAddUserModal);
    if (cancelUserBtn) cancelUserBtn.addEventListener('click', closeUserModal);
    if (userForm) userForm.addEventListener('submit', handleUserSubmit);
    if (changePasswordCheck) changePasswordCheck.addEventListener('change', togglePasswordEdit);

    // Ajustar opciones de rol según el usuario actual
    adjustRoleOptions();
}

function adjustRoleOptions() {
    const gerenteOption = document.getElementById('gerente-option');
    const adminOption = document.getElementById('admin-option');

    if (currentUserRole === 'gerente') {
        // Gerentes solo pueden crear empleados
        if (gerenteOption) gerenteOption.disabled = true;
        if (adminOption) adminOption.disabled = true;
    }
}

async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar usuarios');

        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
        showUserNotification('Error al cargar usuarios', 'error');
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('users-table-body');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">No hay usuarios registrados</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.username}</td>
            <td>${user.full_name}</td>
            <td>
                <span class="badge badge-${getRoleBadgeClass(user.role)}">
                    ${getRoleLabel(user.role)}
                </span>
            </td>
            <td>
                <span class="badge badge-${user.active ? 'success' : 'danger'}">
                    ${user.active ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>${new Date(user.created_at).toLocaleDateString('es-CO')}</td>
            <td class="actions">
                ${canEditUser(user) ? `
                    <button onclick="editUser(${user.id})" class="btn-icon" title="Editar">✏️</button>
                    <button onclick="toggleUserStatus(${user.id}, ${user.active})" class="btn-icon" title="${user.active ? 'Desactivar' : 'Activar'}">
                        ${user.active ? '🔒' : '🔓'}
                    </button>
                ` : '<span class="text-muted">Sin permisos</span>'}
                ${currentUserRole === 'admin' ? `
                    <button onclick="deleteUser(${user.id}, '${user.username}')" class="btn-icon" title="Eliminar">🗑️</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function canEditUser(user) {
    if (currentUserRole === 'admin') return true;
    if (currentUserRole === 'gerente' && user.role === 'empleado') return true;
    return false;
}

function getRoleBadgeClass(role) {
    const classes = {
        'admin': 'danger',
        'gerente': 'warning',
        'empleado': 'info'
    };
    return classes[role] || 'secondary';
}

function getRoleLabel(role) {
    const labels = {
        'admin': '👑 Admin',
        'gerente': '⭐ Gerente',
        'empleado': '👤 Empleado'
    };
    return labels[role] || role;
}

function showAddUserModal() {
    currentEditingUserId = null;
    document.getElementById('user-modal-title').textContent = 'Nuevo Usuario';
    document.getElementById('user-form').reset();
    document.getElementById('user-username').disabled = false;
    document.getElementById('password-group').style.display = 'block';
    document.getElementById('password-edit-group').style.display = 'none';
    document.getElementById('user-password').required = true;

    adjustRoleOptions();
    document.getElementById('user-modal').classList.remove('hidden');
}

function editUser(userId) {
    currentEditingUserId = userId;

    // Buscar el usuario en la tabla
    fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(users => {
            const user = users.find(u => u.id === userId);
            if (!user) throw new Error('Usuario no encontrado');

            document.getElementById('user-modal-title').textContent = 'Editar Usuario';
            document.getElementById('user-username').value = user.username;
            document.getElementById('user-username').disabled = true;
            document.getElementById('user-fullname').value = user.full_name;
            document.getElementById('user-role').value = user.role;
            document.getElementById('user-role').disabled = true; // No permitir cambiar rol

            document.getElementById('password-group').style.display = 'none';
            document.getElementById('password-edit-group').style.display = 'block';
            document.getElementById('user-password').required = false;
            document.getElementById('change-password-check').checked = false;

            document.getElementById('user-modal').classList.remove('hidden');
        })
        .catch(error => {
            console.error('Error loading user:', error);
            showUserNotification('Error al cargar usuario', 'error');
        });
}

function togglePasswordEdit() {
    const checked = document.getElementById('change-password-check').checked;
    const passwordGroup = document.getElementById('password-group');
    const passwordInput = document.getElementById('user-password');

    if (checked) {
        passwordGroup.style.display = 'block';
        passwordInput.required = true;
    } else {
        passwordGroup.style.display = 'none';
        passwordInput.required = false;
        passwordInput.value = '';
    }
}

async function handleUserSubmit(e) {
    e.preventDefault();

    const username = document.getElementById('user-username').value;
    const fullName = document.getElementById('user-fullname').value;
    const role = document.getElementById('user-role').value;
    const password = document.getElementById('user-password').value;

    const data = { fullName };

    if (currentEditingUserId) {
        // Editar usuario
        if (password) {
            data.password = password;
        }

        try {
            const response = await fetch(`${API_URL}/users/${currentEditingUserId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al actualizar usuario');
            }

            showUserNotification('Usuario actualizado exitosamente', 'success');
            closeUserModal();
            loadUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            showUserNotification(error.message, 'error');
        }
    } else {
        // Crear usuario
        data.username = username;
        data.password = password;
        data.role = role;

        try {
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al crear usuario');
            }

            showUserNotification('Usuario creado exitosamente', 'success');
            closeUserModal();
            loadUsers();
        } catch (error) {
            console.error('Error creating user:', error);
            showUserNotification(error.message, 'error');
        }
    }
}

async function toggleUserStatus(userId, currentStatus) {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activar' : 'desactivar';

    if (!confirm(`¿Está seguro de ${action} este usuario?`)) return;

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ active: newStatus })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `Error al ${action} usuario`);
        }

        showUserNotification(`Usuario ${action === 'activar' ? 'activado' : 'desactivado'} exitosamente`, 'success');
        loadUsers();
    } catch (error) {
        console.error('Error toggling user status:', error);
        showUserNotification(error.message, 'error');
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`¿Está seguro de eliminar el usuario "${username}"?\n\nEsta acción no se puede deshacer.`)) return;

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar usuario');
        }

        showUserNotification('Usuario eliminado exitosamente', 'success');
        loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        showUserNotification(error.message, 'error');
    }
}

function closeUserModal() {
    document.getElementById('user-modal').classList.add('hidden');
    document.getElementById('user-form').reset();
    currentEditingUserId = null;
}

// Función para mostrar la vista de usuarios
function showUsers() {
    loadUsers();
}


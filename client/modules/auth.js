// Módulo de autenticación
import { state, setToken, setCurrentUser } from './state.js';

const API_URL = window.CONFIG?.API_URL || 'http://localhost:3000/api';
const apiClient = window.api;

export async function login(username, password) {
    const data = await apiClient.post('/auth/login', { username, password });
    setToken(data.token);
    setCurrentUser(data.user);
    return data;
}

export function logout() {
    setToken(null);
    setCurrentUser(null);
}

export function initLoginForm(onSuccess) {
    const loginForm = document.getElementById('login-form');
    const errorDiv = document.getElementById('login-error');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            await login(username, password);
            errorDiv.textContent = '';
            onSuccess();
        } catch (error) {
            if (error && error.error) {
                errorDiv.textContent = error.error;
            } else {
                errorDiv.textContent = 'Error de conexión';
            }
        }
    });
}

export function initLogoutButton(onLogout) {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
            onLogout();
        });
    }
}

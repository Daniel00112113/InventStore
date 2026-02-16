// Módulo de dashboard
import { getToken } from './state.js';

const API_URL = window.CONFIG?.API_URL || 'http://localhost:3000/api';

export async function loadDashboard() {
    try {
        const res = await fetch(`${API_URL}/dashboard`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        document.getElementById('daily-sales').textContent = `${data.dailySales.toLocaleString()}`;
        document.getElementById('monthly-sales').textContent = `${data.monthlySales.toLocaleString()}`;
        document.getElementById('monthly-profit').textContent = `${data.monthlyProfit.toLocaleString()}`;
        document.getElementById('low-stock').textContent = data.lowStockCount;
        document.getElementById('pending-credit').textContent = `${data.pendingCredit.toLocaleString()}`;

        // Cargar gráficos del dashboard
        if (typeof loadDashboardCharts === 'function') {
            loadDashboardCharts();
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

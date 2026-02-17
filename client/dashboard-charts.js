// Variables globales para los gráficos
let salesChart = null;
let topProductsChart = null;

async function loadDashboardCharts() {
    try {
        // Obtener datos de ventas de los últimos 7 días
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const salesRes = await fetch(`${API_URL}/reports/sales-by-date?startDate=${startDate}&endDate=${endDate}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const salesData = await salesRes.json();

        // Obtener productos más vendidos
        const productsRes = await fetch(`${API_URL}/reports/top-products?startDate=${startDate}&endDate=${endDate}&limit=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const productsData = await productsRes.json();

        // Crear gráficos
        createSalesChart(salesData);
        createTopProductsChart(productsData);
    } catch (error) {
        console.error('Error loading charts:', error);
    }
}

function createSalesChart(data) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    if (salesChart) salesChart.destroy();

    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#e0e0e0' : '#333';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => new Date(d.date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })),
            datasets: [{
                label: 'Ventas',
                data: data.map(d => d.total_amount),
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `$${context.parsed.y.toLocaleString()}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        callback: (value) => `$${value.toLocaleString()}`
                    },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

function createTopProductsChart(data) {
    const ctx = document.getElementById('topProductsChart');
    if (!ctx) return;

    if (topProductsChart) topProductsChart.destroy();

    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#e0e0e0' : '#333';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

    topProductsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(p => p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name),
            datasets: [{
                label: 'Cantidad',
                data: data.map(p => p.total_quantity),
                backgroundColor: colors,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.parsed.y} unidades`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        stepSize: 1
                    },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { display: false }
                }
            }
        }
    });
}

// Estado global de la aplicación
export const state = {
    token: localStorage.getItem('token'),
    currentUser: null,
    saleItems: [],
    showLowStockOnly: false,
    showDebtOnly: false,
    lastSaleId: null,
    currentTotal: 0,
    allProducts: [],
    searchTimeout: null,
    salesViewInitialized: false,
    reportsViewInitialized: false,
    returnsViewInitialized: false,
    invoicesViewInitialized: false,
    cashRegisterViewInitialized: false,
    returnItems: [],
    selectedSaleId: null,
    currentClosingSummary: null
};

// Getters y setters para el token
export function getToken() {
    return state.token;
}

export function setToken(token) {
    state.token = token;
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
}

export function getCurrentUser() {
    return state.currentUser;
}

export function setCurrentUser(user) {
    state.currentUser = user;
    if (user?.role) {
        localStorage.setItem('userRole', user.role);
    }
}

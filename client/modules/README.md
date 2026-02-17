# 📦 Módulos del Cliente

Módulos ES6 organizados por funcionalidad.

## 📋 Índice de Módulos

### 🔐 [state.js](./state.js)
**Estado global de la aplicación**

Exporta:
- `state` - Objeto con todo el estado
- `getToken()` - Obtener token JWT
- `setToken(token)` - Guardar token
- `getCurrentUser()` - Obtener usuario actual
- `setCurrentUser(user)` - Guardar usuario

Uso:
```javascript
import { getToken, state } from './state.js';

const token = getToken();
state.saleItems.push(item);
```

---

### 🔑 [auth.js](./auth.js)
**Autenticación y sesiones**

Exporta:
- `login(username, password)` - Iniciar sesión
- `logout()` - Cerrar sesión
- `initLoginForm(onSuccess)` - Inicializar formulario
- `initLogoutButton(onLogout)` - Inicializar botón

Uso:
```javascript
import { login, logout } from './auth.js';

await login('usuario', 'contraseña');
logout();
```

---

### 🎨 [ui.js](./ui.js)
**Interfaz de usuario y navegación**

Exporta:
- `views` - Objeto con todas las vistas
- `showLogin()` - Mostrar pantalla de login
- `showDashboard()` - Mostrar dashboard
- `initDarkMode()` - Inicializar modo oscuro
- `initMenuNavigation(loaders)` - Inicializar menú

Uso:
```javascript
import { showDashboard, initDarkMode } from './ui.js';

initDarkMode();
showDashboard();
```

---

### 📊 [dashboard.js](./dashboard.js)
**Dashboard principal**

Exporta:
- `loadDashboard()` - Cargar métricas del dashboard

Uso:
```javascript
import { loadDashboard } from './dashboard.js';

await loadDashboard();
```

---

### 📦 [products.js](./products.js)
**Gestión de productos**

Exporta:
- `loadProducts()` - Cargar lista de productos
- `initProductsEventListeners()` - Inicializar eventos

Funciones globales:
- `window.editProduct(id)` - Editar producto
- `window.deleteProduct(id)` - Eliminar producto

Uso:
```javascript
import { loadProducts, initProductsEventListeners } from './products.js';

await loadProducts();
initProductsEventListeners();
```

---

### 🏷️ [categories.js](./categories.js)
**Gestión de categorías**

Exporta:
- `loadCategories()` - Cargar lista de categorías
- `initCategoriesEventListeners()` - Inicializar eventos

Funciones globales:
- `window.editCategory(id)` - Editar categoría
- `window.deleteCategory(id)` - Eliminar categoría

Uso:
```javascript
import { loadCategories, initCategoriesEventListeners } from './categories.js';

await loadCategories();
initCategoriesEventListeners();
```

---

### 👥 [customers.js](./customers.js)
**Gestión de clientes**

Exporta:
- `loadCustomers()` - Cargar lista de clientes
- `initCustomersEventListeners()` - Inicializar eventos

Funciones globales:
- `window.editCustomer(id)` - Editar cliente
- `window.showPaymentModal(id, name, balance)` - Mostrar modal de pago

Uso:
```javascript
import { loadCustomers, initCustomersEventListeners } from './customers.js';

await loadCustomers();
initCustomersEventListeners();
```

---

### 💰 [sales.js](./sales.js)
**Proceso de ventas**

Exporta:
- `loadAllProductsForSale()` - Cargar productos para venta
- `loadSalesView()` - Inicializar vista de ventas
- `initSalesEventListeners()` - Inicializar eventos

Funciones globales:
- `window.addProductToCart(id, name, price, stock)` - Agregar al carrito
- `window.updateQuantity(id, change)` - Actualizar cantidad
- `window.removeFromCart(id)` - Remover del carrito

Uso:
```javascript
import { loadSalesView, initSalesEventListeners } from './sales.js';

await loadSalesView();
initSalesEventListeners();
```

---

## 🔄 Dependencias entre Módulos

```
state.js (base)
    ↓
auth.js → ui.js
    ↓       ↓
dashboard.js
    ↓
products.js
categories.js
customers.js
sales.js
```

## 📝 Convenciones

### Nombres de Funciones

- **Públicas (exportadas)**: `camelCase`
  ```javascript
  export async function loadProducts() { }
  ```

- **Privadas**: `camelCase` sin export
  ```javascript
  function helperFunction() { }
  ```

- **Globales**: Asignadas a `window`
  ```javascript
  window.editProduct = function(id) { }
  ```

### Imports

Siempre usar rutas relativas:
```javascript
// ✅ Correcto
import { state } from './state.js';

// ❌ Incorrecto
import { state } from 'state.js';
import { state } from '/modules/state.js';
```

### Exports

Preferir named exports:
```javascript
// ✅ Correcto
export function loadData() { }
export function saveData() { }

// ❌ Evitar
export default { loadData, saveData };
```

## 🧪 Testing

Cada módulo puede testearse independientemente:

```javascript
// test/products.test.js
import { loadProducts } from '../modules/products.js';

describe('Products Module', () => {
    it('should load products', async () => {
        // Test implementation
    });
});
```

## 📚 Recursos

- [Guía de Modularización](../MODULARIZATION.md)
- [Guía Rápida](../QUICK_START.md)
- [Resumen de Migración](../MIGRATION_SUMMARY.md)

## 🤝 Contribuir

Para agregar un nuevo módulo:

1. Crear archivo en `modules/`
2. Seguir convenciones establecidas
3. Documentar exports en este README
4. Agregar tests si es posible
5. Actualizar diagrama de dependencias

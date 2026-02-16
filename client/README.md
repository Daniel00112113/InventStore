# 📱 Frontend - InvenStore

## 🎉 Nueva Arquitectura Modular

El código del cliente ha sido **completamente modularizado** para mejorar la mantenibilidad y escalabilidad.

📖 **Ver [MODULARIZATION.md](./MODULARIZATION.md) para la guía completa de modularización**

### Estructura Modular

```
client/
├── modules/              # 🆕 Módulos ES6
│   ├── state.js         # Estado global
│   ├── auth.js          # Autenticación
│   ├── ui.js            # Interfaz de usuario
│   ├── dashboard.js     # Dashboard
│   ├── products.js      # Productos
│   ├── categories.js    # Categorías
│   ├── customers.js     # Clientes
│   └── sales.js         # Ventas
├── app-modular.js       # 🆕 Punto de entrada modular
├── index-modular.html   # 🆕 HTML para versión modular
├── app.js               # Versión original (2334 líneas)
└── index.html           # HTML original
```

### Ventajas de la Versión Modular

- ✅ **Mantenibilidad**: Código organizado por funcionalidad
- ✅ **Escalabilidad**: Archivos más pequeños (80-250 líneas vs 2334)
- ✅ **Testing**: Cada módulo puede testearse independientemente
- ✅ **Colaboración**: Múltiples desarrolladores sin conflictos
- ✅ **Performance**: Posibilidad de lazy loading
- ✅ **Reutilización**: Módulos importables donde se necesiten

### Migración a Versión Modular

Para usar la versión modular, simplemente renombra los archivos:

```bash
# Backup de la versión original
mv client/index.html client/index-legacy.html
mv client/app.js client/app-legacy.js

# Activar versión modular
mv client/index-modular.html client/index.html
```

O edita `index.html` y reemplaza:
```html
<script src="app.js?v=2.3"></script>
```

Por:
```html
<script type="module" src="app-modular.js"></script>
```

## Arquitectura Modular

El frontend está organizado en módulos independientes para mejor mantenibilidad:

### 📁 Estructura de Archivos

```
client/
├── index.html              # Punto de entrada
├── config.js              # Configuración global
├── api.js                 # Cliente HTTP centralizado
├── loading.js             # Sistema de loading states
├── notifications.js       # Sistema de notificaciones toast
├── error-handler.js       # Manejo de errores global
├── app.js                 # Lógica principal de la aplicación
├── users.js               # Módulo de gestión de usuarios
├── dashboard-charts.js    # Gráficos del dashboard
├── utils.js               # Utilidades compartidas
└── styles.css             # Estilos globales
```

## 🔧 Módulos Principales

### 1. **config.js** - Configuración
Detecta automáticamente el entorno y configura la URL de la API.

```javascript
// Uso
const apiUrl = window.CONFIG.API_URL;
```

### 2. **api.js** - Cliente HTTP
Centraliza todas las llamadas a la API con manejo de errores consistente.

```javascript
// Uso
const data = await api.get('/products');
const result = await api.post('/sales', saleData);
const updated = await api.patch('/users/1', userData);
await api.delete('/products/5');
```

**Características:**
- ✅ Timeout automático (30s)
- ✅ Manejo de errores consistente
- ✅ Loading states automáticos
- ✅ Retry logic (próximamente)
- ✅ Token JWT automático

### 3. **notifications.js** - Notificaciones
Sistema de toast notifications moderno y no intrusivo.

```javascript
// Uso
notifications.success('Usuario creado exitosamente');
notifications.error('Error al guardar');
notifications.warning('Stock bajo');
notifications.info('Datos actualizados');

// Loading persistente
const loader = notifications.loading('Procesando...');
// ... operación
loader.remove();
```

### 4. **loading.js** - Estados de Carga
Indicadores de carga globales y por componente.

```javascript
// Loading global
showLoading(true, 'Cargando datos...');
// ... operación
showLoading(false);

// Loading en elemento específico
const loader = loadingManager.showInElement(element, 'Guardando...');
// ... operación
loadingManager.hideInElement(element);
```

### 5. **error-handler.js** - Manejo de Errores
Captura y maneja errores de forma consistente en toda la aplicación.

```javascript
// Manejo automático
try {
    await api.post('/endpoint', data);
} catch (error) {
    // El error se maneja automáticamente
    // Muestra notificación apropiada
    // Maneja sesiones expiradas
}

// Manejo manual
try {
    // código
} catch (error) {
    handleError(error, 'Mensaje personalizado');
}
```

**Características:**
- ✅ Captura errores no manejados
- ✅ Maneja promesas rechazadas
- ✅ Sesiones expiradas automáticas
- ✅ Mensajes de error amigables
- ✅ Logging en desarrollo

## 🎨 Sistema de Notificaciones

### Tipos de Notificaciones

- **Success** (verde): Operaciones exitosas
- **Error** (rojo): Errores y fallos
- **Warning** (amarillo): Advertencias
- **Info** (azul): Información general
- **Loading** (morado): Operaciones en progreso

### Personalización

```javascript
// Duración personalizada (ms)
notifications.success('Guardado', 2000);

// Sin auto-cerrar
const notif = notifications.show('Mensaje', 'info', 0);
// Cerrar manualmente
notif.remove();
```

## 🔄 Flujo de Datos

```
Usuario → Acción → API Client → Loading → Request
                                    ↓
                              Error Handler
                                    ↓
                              Notification
                                    ↓
                              UI Update
```

## 📊 Manejo de Estados

### Loading States
- **Global**: Overlay completo para operaciones críticas
- **Local**: Spinner en componentes específicos
- **Botones**: Estado de loading en botones de acción

### Error States
- **Network**: Sin conexión a internet
- **401**: Sesión expirada (redirect automático)
- **403**: Sin permisos
- **404**: Recurso no encontrado
- **500**: Error del servidor

## 🚀 Mejores Prácticas

### 1. Usar el Cliente API
```javascript
// ❌ NO hacer esto
fetch('/api/endpoint', { ... });

// ✅ Hacer esto
api.get('/endpoint');
```

### 2. Manejar Errores
```javascript
// ❌ NO hacer esto
try {
    const data = await api.get('/data');
} catch (error) {
    alert(error.message);
}

// ✅ Hacer esto
try {
    const data = await api.get('/data');
} catch (error) {
    // El error se maneja automáticamente
    // Solo agregar lógica adicional si es necesario
}
```

### 3. Notificaciones
```javascript
// ❌ NO hacer esto
alert('Operación exitosa');

// ✅ Hacer esto
notifications.success('Operación exitosa');
```

### 4. Loading States
```javascript
// ❌ NO hacer esto
button.disabled = true;
// operación
button.disabled = false;

// ✅ Hacer esto
button.classList.add('btn-loading');
// operación (el API client maneja el loading global)
button.classList.remove('btn-loading');
```

## 🔐 Seguridad

- ✅ Token JWT en todas las requests
- ✅ Timeout de requests (30s)
- ✅ Manejo de sesiones expiradas
- ✅ Validación de respuestas
- ✅ Sanitización de inputs (próximamente)

## 📈 Performance

- ✅ Requests con timeout
- ✅ Loading states para UX
- ✅ Caché de configuración
- ✅ Lazy loading de módulos (próximamente)
- ✅ Debouncing de búsquedas (próximamente)

## 🐛 Debugging

### Modo Desarrollo
En desarrollo, los errores muestran más detalles en la consola.

### Logs
```javascript
// Ver configuración
console.log(window.CONFIG);

// Ver estado de loading
console.log(loadingManager.activeRequests);

// Ver notificaciones activas
console.log(notifications.container.children);
```

## 🔄 Próximas Mejoras

- [ ] Retry logic en requests fallidos
- [ ] Caché de requests GET
- [ ] Optimistic UI updates
- [ ] Offline mode
- [ ] Service Workers
- [ ] Progressive Web App (PWA)

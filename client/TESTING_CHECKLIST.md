# ✅ Checklist de Pruebas - Versión Modular

Usa este checklist para verificar que la versión modular funciona correctamente.

## 🔧 Pre-requisitos

- [ ] Navegador moderno (Chrome 61+, Firefox 60+, Safari 11+)
- [ ] Servidor backend corriendo
- [ ] Archivos modulares en `client/modules/`
- [ ] `app-modular.js` presente

## 🚀 Activación

- [ ] Versión modular activada en `index.html`
- [ ] No hay errores en consola al cargar
- [ ] Todos los módulos se cargan correctamente

## 🔐 Autenticación

### Login
- [ ] Formulario de login se muestra correctamente
- [ ] Validación de campos vacíos funciona
- [ ] Login con credenciales correctas funciona
- [ ] Login con credenciales incorrectas muestra error
- [ ] Token se guarda en localStorage
- [ ] Redirección a dashboard después de login

### Logout
- [ ] Botón de logout visible
- [ ] Logout limpia token
- [ ] Logout redirige a login
- [ ] No se puede acceder a dashboard sin token

## 🎨 Interfaz de Usuario

### Navegación
- [ ] Menú lateral se muestra correctamente
- [ ] Todos los botones del menú funcionan
- [ ] Vista activa se marca correctamente
- [ ] Transiciones entre vistas funcionan

### Modo Oscuro
- [ ] Botón de modo oscuro visible
- [ ] Toggle entre claro/oscuro funciona
- [ ] Preferencia se guarda en localStorage
- [ ] Modo se mantiene al recargar página

### Responsive
- [ ] Layout se adapta a pantalla pequeña
- [ ] Menú funciona en móvil
- [ ] Modales se ven bien en móvil

## 📊 Dashboard

- [ ] Métricas se cargan correctamente
- [ ] Ventas del día se muestran
- [ ] Ventas del mes se muestran
- [ ] Ganancia del mes se muestra
- [ ] Stock bajo se muestra
- [ ] Crédito pendiente se muestra
- [ ] Gráficos se renderizan (si aplica)

## 📦 Productos

### Listar
- [ ] Lista de productos se carga
- [ ] Productos se muestran con información correcta
- [ ] Badge de "Stock Bajo" aparece cuando corresponde
- [ ] Botones de acción visibles

### Filtros
- [ ] Botón "Ver Stock Bajo" funciona
- [ ] Filtro muestra solo productos con stock bajo
- [ ] Botón cambia a "Ver Todos"
- [ ] "Ver Todos" muestra todos los productos

### Crear
- [ ] Botón "Agregar Producto" abre modal
- [ ] Formulario se muestra vacío
- [ ] Validación de campos funciona
- [ ] Crear producto guarda correctamente
- [ ] Modal se cierra después de guardar
- [ ] Lista se actualiza con nuevo producto

### Editar
- [ ] Botón "Editar" abre modal
- [ ] Formulario se llena con datos del producto
- [ ] Modificar producto guarda cambios
- [ ] Lista se actualiza con cambios

### Eliminar
- [ ] Botón "Eliminar" muestra confirmación
- [ ] Cancelar no elimina producto
- [ ] Confirmar elimina producto
- [ ] Lista se actualiza sin el producto

## 🏷️ Categorías

### Listar
- [ ] Lista de categorías se carga
- [ ] Categorías muestran nombre y descripción
- [ ] Contador de productos funciona

### Crear
- [ ] Modal de crear categoría funciona
- [ ] Guardar categoría funciona
- [ ] Lista se actualiza

### Editar
- [ ] Modal de editar se llena correctamente
- [ ] Guardar cambios funciona
- [ ] Lista se actualiza

### Eliminar
- [ ] Confirmación de eliminación funciona
- [ ] Eliminar categoría funciona
- [ ] Lista se actualiza

## 👥 Clientes

### Listar
- [ ] Lista de clientes se carga
- [ ] Clientes muestran información correcta
- [ ] Badge de deuda aparece cuando corresponde
- [ ] Botón "Pagar" visible para clientes con deuda

### Filtros
- [ ] Botón "Ver Con Deuda" funciona
- [ ] Filtro muestra solo clientes con deuda
- [ ] "Ver Todos" muestra todos los clientes

### Crear
- [ ] Modal de crear cliente funciona
- [ ] Validación de campos funciona
- [ ] Guardar cliente funciona
- [ ] Lista se actualiza

### Editar
- [ ] Modal de editar se llena correctamente
- [ ] Guardar cambios funciona
- [ ] Lista se actualiza

### Pagos
- [ ] Modal de pago se abre correctamente
- [ ] Muestra nombre y saldo del cliente
- [ ] Validación de monto funciona
- [ ] Registrar pago funciona
- [ ] Saldo se actualiza
- [ ] Dashboard se actualiza

## 💰 Ventas

### Carrito
- [ ] Carrito inicia vacío
- [ ] Mensaje "Carrito vacío" se muestra

### Búsqueda de Productos
- [ ] Input de búsqueda funciona
- [ ] Sugerencias aparecen al escribir
- [ ] Búsqueda por nombre funciona
- [ ] Búsqueda por código de barras funciona
- [ ] Sugerencias muestran stock y precio

### Agregar Productos
- [ ] Click en sugerencia agrega al carrito
- [ ] Enter en input agrega producto
- [ ] Producto se agrega con cantidad 1
- [ ] Agregar producto existente incrementa cantidad
- [ ] No permite agregar sin stock
- [ ] No permite exceder stock disponible

### Modificar Carrito
- [ ] Botón "+" incrementa cantidad
- [ ] Botón "-" decrementa cantidad
- [ ] Cantidad 0 elimina producto
- [ ] Botón "🗑️" elimina producto
- [ ] Total se actualiza correctamente

### Métodos de Pago
- [ ] Selector de método de pago funciona
- [ ] "Efectivo" no requiere cliente
- [ ] "Fiado" requiere seleccionar cliente
- [ ] "Mixto" muestra campos de efectivo y fiado
- [ ] Validación de montos en "Mixto" funciona
- [ ] Suma de efectivo + fiado = total

### Completar Venta
- [ ] No permite venta sin productos
- [ ] No permite fiado sin cliente
- [ ] Validación de montos funciona
- [ ] Venta se registra correctamente
- [ ] Carrito se limpia después de venta
- [ ] Modal de éxito se muestra
- [ ] Dashboard se actualiza

### Imprimir Ticket
- [ ] Botón "Imprimir Ticket" funciona
- [ ] Ticket se abre en nueva ventana
- [ ] Ticket muestra información correcta

## 🧪 Pruebas de Integración

### Flujo Completo de Venta
1. [ ] Login exitoso
2. [ ] Navegar a Ventas
3. [ ] Buscar y agregar 3 productos
4. [ ] Modificar cantidades
5. [ ] Seleccionar método de pago
6. [ ] Completar venta
7. [ ] Verificar en Dashboard
8. [ ] Imprimir ticket

### Flujo de Gestión de Inventario
1. [ ] Login exitoso
2. [ ] Navegar a Productos
3. [ ] Crear nuevo producto
4. [ ] Editar producto
5. [ ] Verificar en lista
6. [ ] Filtrar por stock bajo
7. [ ] Eliminar producto

### Flujo de Gestión de Clientes
1. [ ] Login exitoso
2. [ ] Navegar a Clientes
3. [ ] Crear nuevo cliente
4. [ ] Hacer venta fiada al cliente
5. [ ] Verificar deuda en lista
6. [ ] Registrar pago
7. [ ] Verificar saldo actualizado

## 🐛 Pruebas de Errores

### Manejo de Errores de Red
- [ ] Sin conexión muestra error apropiado
- [ ] Timeout muestra error apropiado
- [ ] Error 500 muestra mensaje amigable

### Validaciones
- [ ] Campos requeridos se validan
- [ ] Números negativos se rechazan
- [ ] Formatos inválidos se rechazan

### Estados Edge Case
- [ ] Venta con stock 0 se rechaza
- [ ] Pago mayor a deuda se rechaza
- [ ] Eliminar categoría con productos se maneja

## 📱 Compatibilidad

### Navegadores
- [ ] Chrome (última versión)
- [ ] Firefox (última versión)
- [ ] Safari (última versión)
- [ ] Edge (última versión)

### Dispositivos
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Móvil (375x667)

## 🔍 Consola del Navegador

- [ ] No hay errores en consola
- [ ] No hay warnings críticos
- [ ] Módulos se cargan correctamente
- [ ] No hay requests fallidos

## 📊 Performance

- [ ] Carga inicial < 3 segundos
- [ ] Navegación entre vistas es fluida
- [ ] Búsqueda de productos es rápida
- [ ] No hay lag al escribir

## 🔒 Seguridad

- [ ] Token se envía en todas las requests
- [ ] Sesión expirada redirige a login
- [ ] No se puede acceder sin autenticación
- [ ] Datos sensibles no se exponen en consola

## ✅ Resultado Final

**Total de pruebas:** _____ / _____

**Estado:** 
- [ ] ✅ Todas las pruebas pasaron - Listo para producción
- [ ] ⚠️ Algunas pruebas fallaron - Revisar y corregir
- [ ] ❌ Muchas pruebas fallaron - Revertir a versión original

## 📝 Notas

Anota aquí cualquier problema encontrado:

```
Fecha: ___________
Navegador: ___________
Problema: ___________
Pasos para reproducir: ___________
```

## 🚀 Siguiente Paso

Si todas las pruebas pasaron:
1. Eliminar archivos legacy (`app.js`, `index-legacy.html`)
2. Renombrar archivos modulares como principales
3. Actualizar documentación
4. Celebrar 🎉

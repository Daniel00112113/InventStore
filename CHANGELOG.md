# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

## [1.0.0] - 2024-02-13

### ✨ Características Iniciales

#### Autenticación y Seguridad
- Sistema de login con JWT
- Hash de contraseñas con bcrypt
- Roles: admin y empleado
- Middleware de validación multi-tenant
- Protección contra acceso cruzado de datos

#### Dashboard
- Métricas en tiempo real
- Ventas del día
- Ventas del mes
- Ganancia estimada
- Contador de productos con stock bajo
- Total de fiado pendiente

#### Gestión de Inventario
- CRUD completo de productos
- Control automático de stock
- Alertas de stock bajo
- Búsqueda por código de barras
- Filtros inteligentes

#### Sistema de Ventas
- Venta rápida
- Soporte para código de barras
- Venta en efectivo
- Venta fiada
- Actualización automática de stock
- Transacciones atómicas

#### Gestión de Clientes
- Registro de clientes
- Control de saldo pendiente
- Historial de pagos
- Registro de abonos
- Filtro de clientes con deuda

#### Reportes
- Ventas por rango de fechas
- Productos más vendidos
- Ganancia neta
- Clientes con mayor deuda

#### Interfaz de Usuario
- Diseño simple y limpio
- Botones grandes
- Modo oscuro
- Diseño responsive
- Optimizado para móviles

#### Panel Administrador
- Vista de todas las tiendas
- Control de suscripciones
- Métricas globales

#### Base de Datos
- SQLite con modo WAL
- Índices optimizados por store_id
- Validaciones de integridad
- Separación lógica multi-tenant

### 📚 Documentación
- README completo
- Guía de arquitectura (ARCHITECTURE.md)
- Guía de despliegue (DEPLOYMENT.md)
- Guía de pruebas (TESTING.md)

### 🔧 Infraestructura
- Servidor Express
- API RESTful
- Frontend vanilla JS
- Sin dependencias frontend
- Configuración con variables de entorno

---

## Formato

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

### Tipos de cambios
- `✨ Agregado` para nuevas características
- `🔧 Cambiado` para cambios en funcionalidad existente
- `⚠️ Deprecado` para características que serán removidas
- `🗑️ Removido` para características removidas
- `🐛 Corregido` para corrección de bugs
- `🔒 Seguridad` para vulnerabilidades

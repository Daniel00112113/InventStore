# 🏪 Sistema SaaS Multi-Tenant - Tienda de Barrio

Sistema completo de gestión de inventario y control de fiado para tiendas de barrio en Colombia. Diseñado para ser simple, ligero y optimizado para personas con baja experiencia tecnológica.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar base de datos
npm run db:setup

# 3. Iniciar servidor
npm run dev

# 4. Abrir navegador en http://localhost:3000
# Usuario: admin | Contraseña: admin123
```

📖 **[Ver guía completa de inicio rápido →](QUICKSTART.md)**

## ✨ Características Completas

### 🔐 Autenticación y Seguridad
- Login seguro con hash de contraseña (bcrypt)
- Tokens JWT con expiración de 24h
- Roles: admin y empleado
- Middleware de validación de tenant
- Protección contra acceso cruzado de datos

### 📊 Dashboard Inteligente
- Ventas del día en tiempo real
- Ventas del mes acumuladas
- Ganancia estimada del mes
- Contador de productos con bajo stock
- Total de fiado pendiente

### 📦 Gestión de Inventario
- CRUD completo de productos
- Control de stock automático
- Alertas de stock bajo
- Búsqueda por código de barras
- Filtros inteligentes

### 💰 Sistema de Ventas
- Venta rápida con código de barras
- Soporte para lector de código de barras
- Venta en efectivo
- Venta fiada con control de clientes
- Actualización automática de stock
- Transacciones atómicas

### 👥 Gestión de Clientes
- Registro completo de clientes
- Control de saldo pendiente
- Historial de pagos
- Registro de abonos
- Filtro de clientes con deuda

### 📈 Reportes Detallados
- Ventas por rango de fechas
- Productos más vendidos
- Ganancia neta (ingresos - costos)
- Clientes con mayor deuda
- Exportación de datos

### 🎨 Interfaz de Usuario
- Diseño extremadamente simple
- Botones grandes y claros
- Modo oscuro opcional
- Diseño 100% responsive
- Optimizado para móviles
- Sin frameworks (carga rápida)

### 🔧 Panel Administrador Global
- Ver todas las tiendas registradas
- Estado de suscripción por tienda
- Activar / desactivar tiendas
- Métricas globales del sistema
- Control centralizado

### 🚀 Multi-Tenant
- Separación lógica por `store_id`
- Índices optimizados
- Validaciones de integridad
- Escalable a miles de tiendas

## 📋 Requisitos

- Node.js 18+
- npm o yarn

## 🛠️ Instalación Rápida

```bash
# 1. Clonar repositorio
git clone <tu-repo>
cd tienda-barrio-saas

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env y cambiar JWT_SECRET

# 4. Inicializar base de datos
npm run db:setup

# 5. Iniciar servidor
npm run dev
```

El sistema estará disponible en `http://localhost:3000`

## 🔑 Credenciales Demo

- **Usuario:** admin
- **Contraseña:** admin123
- **Tienda:** Tienda Demo

## 📁 Estructura del Proyecto

```
tienda-barrio-saas/
├── server/
│   ├── config/
│   │   └── db.js              # Configuración SQLite
│   ├── db/
│   │   ├── schema.sql         # Esquema de base de datos
│   │   └── setup.js           # Script de inicialización
│   ├── middleware/
│   │   └── auth.js            # Autenticación y validación
│   ├── routes/
│   │   ├── auth.js            # Login
│   │   ├── dashboard.js       # Métricas
│   │   ├── products.js        # Inventario
│   │   ├── sales.js           # Ventas
│   │   ├── customers.js       # Clientes
│   │   ├── reports.js         # Reportes
│   │   └── admin.js           # Panel admin
│   └── index.js               # Servidor principal
├── client/
│   ├── index.html             # SPA principal
│   ├── app.js                 # Lógica frontend
│   └── styles.css             # Estilos + modo oscuro
├── package.json
├── .env                       # Variables de entorno
├── README.md                  # Este archivo
├── ARCHITECTURE.md            # Documentación técnica
├── DEPLOYMENT.md              # Guía de despliegue
└── TESTING.md                 # Guía de pruebas
```

## 🔌 API Endpoints

### Autenticación
```
POST /api/auth/login          # Login de usuario
```

### Dashboard
```
GET  /api/dashboard           # Métricas principales
```

### Productos
```
GET    /api/products                    # Listar todos
GET    /api/products/barcode/:barcode   # Buscar por código
GET    /api/products/low-stock          # Productos con stock bajo
POST   /api/products                    # Crear producto
PUT    /api/products/:id                # Actualizar producto
DELETE /api/products/:id                # Eliminar producto
```

### Ventas
```
GET  /api/sales           # Listar ventas
POST /api/sales           # Crear venta
GET  /api/sales/:id       # Detalle de venta
```

### Clientes
```
GET  /api/customers                    # Listar todos
GET  /api/customers/with-debt          # Solo con deuda
POST /api/customers                    # Crear cliente
PUT  /api/customers/:id                # Actualizar cliente
POST /api/customers/:id/payment        # Registrar pago
GET  /api/customers/:id/payments       # Historial de pagos
```

### Reportes
```
GET /api/reports/sales-by-date    # Ventas por fecha
GET /api/reports/top-products     # Productos más vendidos
GET /api/reports/profit           # Ganancia neta
GET /api/reports/top-debtors      # Clientes con mayor deuda
```

### Admin (Super Admin)
```
GET   /api/admin/stores                      # Listar tiendas
PATCH /api/admin/stores/:id/subscription     # Cambiar estado
GET   /api/admin/metrics                     # Métricas globales
```

## 🗄️ Base de Datos

### Tablas Principales

- **stores:** Tiendas (tenants)
- **users:** Usuarios por tienda
- **products:** Inventario por tienda
- **customers:** Clientes por tienda
- **sales:** Ventas por tienda
- **sale_items:** Detalle de ventas
- **payments:** Pagos de clientes

### Índices Optimizados

Todos los índices incluyen `store_id` para máxima performance multi-tenant:

```sql
idx_users_store (store_id)
idx_products_store (store_id)
idx_products_barcode (store_id, barcode)
idx_sales_store (store_id)
idx_sales_date (store_id, created_at)
```

## 🔒 Seguridad

### Implementado

✅ Hash de contraseñas con bcrypt (10 rounds)  
✅ JWT con expiración de 24 horas  
✅ Middleware de validación de tenant en todas las rutas  
✅ Prepared statements (prevención SQL injection)  
✅ Validación de estado de suscripción  
✅ Separación lógica de datos por store_id  
✅ CORS configurado  

### Recomendaciones para Producción

- Cambiar `JWT_SECRET` a valor aleatorio seguro
- Usar HTTPS (SSL/TLS)
- Implementar rate limiting
- Configurar backups automáticos
- Monitorear logs de acceso

## 📱 Uso del Sistema

### Para Tenderos

1. **Login:** Ingresar con usuario y contraseña
2. **Dashboard:** Ver resumen del día/mes
3. **Ventas:** 
   - Escanear código de barras
   - Seleccionar efectivo o fiado
   - Completar venta
4. **Inventario:** Agregar/editar productos
5. **Clientes:** Registrar pagos de fiado
6. **Reportes:** Ver estadísticas

### Para Administradores

- Acceso a todas las funciones
- Gestión de usuarios
- Configuración de productos
- Análisis de reportes

## 🚀 Despliegue

### Render.com (Recomendado - 100% GRATIS, sin tarjeta)

```bash
# 1. Sube tu código a GitHub (ya hecho)
git push origin main

# 2. Ve a https://render.com y crea cuenta con GitHub
# 3. New + → Web Service → Conecta tu repo
# 4. Configura y despliega (5 minutos)
```

📖 **[Ver guía completa de Render →](DEPLOYMENT_RENDER.md)**  
🎁 **[Guía de despliegue gratis →](DESPLIEGUE_GRATIS.md)**

### Otras Plataformas

**Fly.io** (Requiere tarjeta, pero gratis hasta $5/mes):
- [Guía completa de Fly.io](DEPLOYMENT_FLYIO.md)
- [Configuración rápida](FLYIO_CONFIG.md)

**Otras opciones**:
Ver [DEPLOYMENT.md](DEPLOYMENT.md) para:
- VPS (Ubuntu/Debian)
- Railway
- Vercel
- Configuración de Nginx
- SSL con Let's Encrypt
- PM2 para producción

## 🧪 Pruebas

Ver [TESTING.md](TESTING.md) para:
- Pruebas manuales
- Pruebas de seguridad
- Pruebas de performance
- Casos de prueba críticos
- Checklist completo

## 📚 Documentación Técnica

Ver [ARCHITECTURE.md](ARCHITECTURE.md) para:
- Arquitectura del sistema
- Modelo multi-tenant
- Flujo de autenticación
- Estructura de datos
- Decisiones de diseño
- Plan de escalabilidad

## 🎯 Roadmap

### Versión 1.0 (Actual)
✅ Multi-tenant básico  
✅ CRUD completo  
✅ Ventas y fiado  
✅ Reportes básicos  
✅ Modo oscuro  

### Versión 1.1 (Próximo)
- [ ] Notificaciones push
- [ ] Exportar reportes a PDF
- [ ] Gráficos interactivos
- [ ] App móvil nativa
- [ ] Integración con WhatsApp

### Versión 2.0 (Futuro)
- [ ] Migración a PostgreSQL
- [ ] Multi-sucursal
- [ ] Facturación electrónica
- [ ] Integración con bancos
- [ ] Analytics avanzado

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles

## 💬 Soporte

- 📧 Email: soporte@tiendabarrio.com
- 💬 WhatsApp: +57 300 123 4567
- 📚 Documentación: [docs.tiendabarrio.com](https://docs.tiendabarrio.com)

## 🙏 Agradecimientos

Desarrollado con ❤️ para las tiendas de barrio de Colombia

---

**¿Listo para empezar?**

```bash
npm install
npm run db:setup
npm run dev
```

Visita `http://localhost:3000` y comienza a gestionar tu tienda! 🎉

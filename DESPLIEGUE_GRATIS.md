# 🎁 Despliegue GRATIS - Sin Tarjeta de Crédito

## 🚀 Opción Recomendada: Render.com

**100% GRATIS - Sin tarjeta de crédito requerida**

### Pasos Rápidos (5 minutos):

#### 1. Crear Cuenta
- Ve a: https://render.com/
- Clic en "Get Started for Free"
- Selecciona "Sign up with GitHub"
- Autoriza Render

#### 2. Crear Web Service
- Dashboard → "New +" → "Web Service"
- Busca: `Daniel00112113/InventStore`
- Clic en "Connect"

#### 3. Configuración Básica
```
Name: tienda-inventario
Region: Oregon (US West)
Branch: main
Build Command: npm install
Start Command: npm run db:setup && npm start
Plan: Free
```

#### 4. Variables de Entorno

Copia y pega estas variables:

```
NODE_ENV=production
PORT=10000
DB_PATH=/opt/render/project/src/database.db
BACKUP_ENABLED=true
BACKUP_HOUR=2
BACKUP_RETENTION_DAYS=30
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

**Secretos** (genera JWT_SECRET con el botón "Generate"):
```
JWT_SECRET=[Haz clic en Generate]
ALLOWED_ORIGINS=https://tienda-inventario.onrender.com
```

#### 5. Agregar Disco
- Scroll a "Disk"
- "Add Disk"
- Name: `tienda-data`
- Mount Path: `/opt/render/project/src`
- Size: 1 GB

#### 6. Desplegar
- Clic en "Create Web Service"
- Espera 3-5 minutos
- ¡Listo! Tu app estará en: `https://tienda-inventario.onrender.com`

---

## 🌟 Otras Opciones Gratuitas

### Opción 2: Vercel (Solo para frontend)
- Gratis sin tarjeta
- Perfecto para apps estáticas
- No soporta SQLite (necesitarías cambiar a PostgreSQL)

### Opción 3: Railway (Requiere tarjeta pero no cobra)
- $5 de crédito gratis al mes
- Requiere tarjeta para verificación
- No te cobra si no excedes el crédito

### Opción 4: Glitch
- Gratis sin tarjeta
- Limitado a 1000 horas/mes
- Bueno para proyectos pequeños

---

## 📊 Comparación

| Plataforma | Tarjeta | Costo | Límites | Recomendado |
|------------|---------|-------|---------|-------------|
| **Render** | ❌ No | $0 | 750h/mes, 1GB | ⭐⭐⭐⭐⭐ |
| Vercel | ❌ No | $0 | Solo frontend | ⭐⭐⭐ |
| Railway | ✅ Sí | $0* | $5 crédito/mes | ⭐⭐⭐⭐ |
| Glitch | ❌ No | $0 | 1000h/mes | ⭐⭐⭐ |
| Fly.io | ✅ Sí | $0* | Requiere tarjeta | ⭐⭐⭐⭐ |

*No te cobran si te mantienes en el tier gratuito

---

## ✅ Recomendación Final

**Usa Render.com** porque:
1. No requiere tarjeta de crédito
2. 750 horas gratis (suficiente para 24/7)
3. Disco persistente de 1GB gratis
4. SSL automático
5. Despliegue automático desde GitHub
6. Fácil de configurar

---

## 🎯 Siguiente Paso

Lee la guía completa: **DEPLOYMENT_RENDER.md**

O sigue los pasos rápidos de arriba y tendrás tu app en línea en 5 minutos! 🚀

# 🚀 Guía de Despliegue en Render.com (100% GRATIS)

## ✨ Ventajas de Render.com

- ✅ **Completamente GRATIS** - No requiere tarjeta de crédito
- ✅ **750 horas gratis al mes** - Suficiente para mantener tu app 24/7
- ✅ **SSL automático** - HTTPS incluido
- ✅ **Despliegue automático** desde GitHub
- ✅ **Base de datos persistente** con disco de 1GB gratis
- ✅ **Sin límite de proyectos**

## 📋 Requisitos

- Cuenta de GitHub (ya la tienes)
- Cuenta de Render.com (gratis, sin tarjeta)

## 🎯 Pasos para Desplegar

### 1. Crear Cuenta en Render.com

1. Ve a: https://render.com/
2. Haz clic en "Get Started for Free"
3. Selecciona "Sign up with GitHub"
4. Autoriza Render a acceder a tus repositorios

### 2. Crear Nuevo Web Service

1. En el dashboard de Render, haz clic en "New +"
2. Selecciona "Web Service"
3. Conecta tu repositorio: `Daniel00112113/InventStore`
4. Haz clic en "Connect"

### 3. Configurar el Servicio

Render detectará automáticamente que es una app Node.js. Configura:

**Información Básica:**
- **Name**: `tienda-inventario`
- **Region**: Oregon (US West) - Gratis
- **Branch**: `main`
- **Runtime**: Node

**Build & Deploy:**
- **Build Command**: `npm install`
- **Start Command**: `npm run db:setup && npm start`

**Plan:**
- Selecciona: **Free** (0$/mes)

### 4. Variables de Entorno

En la sección "Environment Variables", agrega:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `DB_PATH` | `/opt/render/project/src/database.db` |
| `BACKUP_ENABLED` | `true` |
| `BACKUP_HOUR` | `2` |
| `BACKUP_RETENTION_DAYS` | `30` |
| `RATE_LIMIT_WINDOW_MS` | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | `100` |
| `LOG_LEVEL` | `info` |

**Variables Secretas** (haz clic en "Generate" para JWT_SECRET):

| Key | Value |
|-----|-------|
| `JWT_SECRET` | [Haz clic en "Generate" o usa el comando de abajo] |
| `ALLOWED_ORIGINS` | `*` |

**Nota sobre CORS**: Usar `*` permite todas las conexiones. Para mayor seguridad en producción, puedes especificar tu dominio exacto: `https://tu-app.onrender.com`

Para generar JWT_SECRET manualmente:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Disco Persistente (Importante para SQLite)

1. Scroll hasta "Disk"
2. Haz clic en "Add Disk"
3. Configura:
   - **Name**: `tienda-data`
   - **Mount Path**: `/opt/render/project/src`
   - **Size**: 1 GB (gratis)

### 6. Desplegar

1. Haz clic en "Create Web Service"
2. Render comenzará a construir y desplegar tu app
3. Espera 3-5 minutos

### 7. Verificar

Una vez desplegado:

1. Render te dará una URL: `https://tienda-inventario.onrender.com`
2. Abre la URL en tu navegador
3. Deberías ver la página de login

**Credenciales por defecto:**
- Email: `admin@tienda.com`
- Password: `admin123`

## 🔄 Despliegues Automáticos

Cada vez que hagas `git push` a la rama `main`, Render desplegará automáticamente los cambios.

```bash
git add .
git commit -m "Actualización"
git push origin main
```

## 📊 Monitoreo

En el dashboard de Render puedes ver:
- **Logs**: En tiempo real
- **Métricas**: CPU, memoria, requests
- **Eventos**: Historial de despliegues

## ⚠️ Limitaciones del Plan Gratuito

- **Inactividad**: La app se "duerme" después de 15 minutos sin tráfico
- **Primer request**: Puede tardar 30-60 segundos en "despertar"
- **Solución**: Usa un servicio de ping como UptimeRobot (gratis) para mantenerla activa

## 🔧 Comandos Útiles

### Ver Logs
En el dashboard de Render → Logs

### Reiniciar Servicio
Dashboard → Manual Deploy → "Clear build cache & deploy"

### Actualizar Variables de Entorno
Dashboard → Environment → Editar → Save Changes

### Backup Manual de Base de Datos
Render no tiene acceso SSH directo en el plan gratuito, pero puedes:
1. Crear un endpoint en tu app para descargar el backup
2. O usar el sistema de backup automático que ya está configurado

## 🆙 Alternativa: Despliegue con render.yaml

Si prefieres configuración como código:

1. El archivo `render.yaml` ya está en tu proyecto
2. En Render, selecciona "New → Blueprint"
3. Conecta tu repositorio
4. Render leerá automáticamente `render.yaml`

## 💰 Costos

**Plan Gratuito:**
- 750 horas/mes (suficiente para 24/7)
- 1GB disco persistente
- SSL incluido
- **Costo: $0/mes**

**Si necesitas más:**
- Plan Starter: $7/mes (sin sleep, más recursos)

## 🆘 Solución de Problemas

### La app no inicia
1. Revisa los logs en el dashboard
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que el disco esté montado correctamente

### Error de base de datos
1. Verifica que `DB_PATH` sea `/opt/render/project/src/database.db`
2. Confirma que el disco esté montado en `/opt/render/project/src`

### La app se "duerme"
Esto es normal en el plan gratuito. Opciones:
1. Acepta el delay de 30-60s en el primer request
2. Usa UptimeRobot para hacer ping cada 5 minutos
3. Actualiza al plan Starter ($7/mes)

## 🔗 Enlaces Útiles

- Dashboard: https://dashboard.render.com/
- Documentación: https://render.com/docs
- Status: https://status.render.com/
- Comunidad: https://community.render.com/

## 🎉 ¡Listo!

Tu aplicación está desplegada en:
**https://tienda-inventario.onrender.com**

Sin costo, sin tarjeta de crédito, sin complicaciones! 🚀

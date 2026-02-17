# 🔧 Guía de Solución de Problemas - InvenStore

## 🚨 Errores Comunes en Producción

### 1. Error CORS: "No permitido por CORS"

**Síntomas:**
```
Error: No permitido por CORS
at origin (file:///opt/render/project/src/server/index.js:62:22)
```

**Causa:** La configuración CORS no permite el dominio de producción.

**Solución:**

1. **Opción A - Permitir todos los dominios (más simple):**
   ```bash
   # En las variables de entorno de Render:
   ALLOWED_ORIGINS=*
   ```

2. **Opción B - Dominio específico (más seguro):**
   ```bash
   # Reemplaza con tu dominio real:
   ALLOWED_ORIGINS=https://tu-app.onrender.com
   ```

3. **Verificar en render.yaml:**
   ```yaml
   - key: ALLOWED_ORIGINS
     value: "*"
   ```

### 2. Error de Base de Datos: "SQLITE_CANTOPEN"

**Síntomas:**
```
Error: SQLITE_CANTOPEN: unable to open database file
```

**Causa:** El disco persistente no está configurado correctamente.

**Solución:**

1. **Verificar configuración del disco:**
   - Name: `tienda-data`
   - Mount Path: `/opt/render/project/src`
   - Size: 1 GB

2. **Verificar variable de entorno:**
   ```bash
   DB_PATH=/opt/render/project/src/database.db
   ```

3. **Reiniciar el servicio:**
   - Dashboard → Manual Deploy → "Clear build cache & deploy"

### 3. Error JWT: "Token inválido"

**Síntomas:**
```
{"error":"Token inválido"}
```

**Causa:** JWT_SECRET no está configurado o cambió.

**Solución:**

1. **Generar nuevo JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Configurar en Render:**
   - Dashboard → Environment → JWT_SECRET → [Pegar el valor generado]

3. **O usar generación automática:**
   - En render.yaml: `generateValue: true`

### 4. App se "Duerme" (Plan Gratuito)

**Síntomas:**
- Primer request tarda 30-60 segundos
- App no responde después de inactividad

**Causa:** Limitación del plan gratuito de Render.

**Soluciones:**

1. **Aceptar el comportamiento** (normal en plan gratuito)

2. **Usar servicio de ping:**
   - UptimeRobot (gratis): https://uptimerobot.com/
   - Configurar ping cada 5 minutos

3. **Actualizar a plan Starter** ($7/mes):
   - Sin sleep
   - Más recursos
   - Mejor rendimiento

### 5. Error de Migración de Base de Datos

**Síntomas:**
```
Error: no such table: users
Error: no such table: invitation_codes
```

**Causa:** Las migraciones no se ejecutaron correctamente.

**Solución:**

1. **Verificar comando de inicio:**
   ```bash
   npm run db:setup && npm start
   ```

2. **Ejecutar migraciones manualmente:**
   ```bash
   # En el dashboard de Render, en la consola:
   npm run db:setup
   ```

3. **Verificar archivos de migración:**
   - `server/db/setup.js`
   - `server/db/migrations/*.sql`

## 🔍 Debugging en Producción

### Ver Logs en Tiempo Real

1. Dashboard de Render → Tu servicio → Logs
2. Filtrar por nivel: Error, Warning, Info

### Variables de Entorno Útiles

```bash
# Más logging detallado
LOG_LEVEL=debug

# Verificar configuración
NODE_ENV=production
```

### Endpoints de Diagnóstico

```bash
# Verificar que la API responde
curl https://tu-app.onrender.com/api/health

# Verificar configuración
curl https://tu-app.onrender.com/health
```

## 🚀 Optimización de Rendimiento

### 1. Configuración de Rate Limiting

```bash
# Ajustar según tu tráfico
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Backup Automático

```bash
# Configurar backup nocturno
BACKUP_ENABLED=true
BACKUP_HOUR=2
BACKUP_RETENTION_DAYS=30
```

### 3. Compresión GZIP

Ya está habilitada automáticamente en el servidor.

## 📱 Problemas del Frontend

### 1. Recursos no Cargan (404)

**Causa:** Rutas incorrectas en producción.

**Solución:**
- Verificar que todos los archivos estén en `/client/`
- Usar rutas relativas: `./assets/` no `/assets/`

### 2. API Calls Fallan

**Causa:** URL de API incorrecta.

**Solución:**
```javascript
// En client/api.js, usar URL relativa:
const API_BASE = '/api';  // ✅ Correcto
// No usar: const API_BASE = 'http://localhost:3000/api';  // ❌ Incorrecto
```

## 🔐 Problemas de Seguridad

### 1. Configurar HTTPS

Render incluye SSL automáticamente. Verificar:
- URL usa `https://`
- Certificado válido en el navegador

### 2. Headers de Seguridad

Ya están configurados automáticamente:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

## 📞 Obtener Ayuda

### 1. Logs del Sistema

```bash
# Ver logs completos
Dashboard → Logs → Download

# Filtrar errores
Dashboard → Logs → Filter: "ERROR"
```

### 2. Comunidad

- Render Community: https://community.render.com/
- GitHub Issues: https://github.com/Daniel00112113/InventStore/issues

### 3. Documentación Oficial

- Render Docs: https://render.com/docs
- Node.js en Render: https://render.com/docs/deploy-node-express-app

## ✅ Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] Variables de entorno configuradas correctamente
- [ ] Disco persistente montado en la ruta correcta
- [ ] JWT_SECRET generado y configurado
- [ ] ALLOWED_ORIGINS incluye tu dominio o usa `*`
- [ ] Comando de inicio incluye `npm run db:setup`
- [ ] Logs no muestran errores de migración
- [ ] Plan gratuito tiene limitaciones conocidas
- [ ] Frontend usa rutas relativas para API calls

## 🆘 Comandos de Emergencia

### Reiniciar Completamente

1. Dashboard → Manual Deploy
2. "Clear build cache & deploy"
3. Esperar 3-5 minutos

### Restaurar Base de Datos

```bash
# Si tienes backup
npm run db:restore

# O recrear desde cero
npm run db:setup
```

### Verificar Configuración

```bash
# Ver todas las variables
env | grep -E "(NODE_ENV|PORT|DB_PATH|JWT_SECRET|ALLOWED_ORIGINS)"
```

---

**💡 Tip:** La mayoría de problemas se resuelven con un redeploy limpio y verificar las variables de entorno.
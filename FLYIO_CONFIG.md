# Configuración Rápida para Fly.io Dashboard

## Variables de Entorno a Configurar

### Variables Secretas (Secrets)
Estas NO deben ir en fly.toml, configúralas en el dashboard o con CLI:

```bash
# JWT_SECRET - Genera uno nuevo con:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# ALLOWED_ORIGINS - Tu dominio de producción
https://tu-app.fly.dev,https://www.tudominio.com
```

### Variables Públicas (ya en fly.toml)
- `NODE_ENV=production`
- `PORT=3000`
- `DB_PATH=/data/database.db`
- `BACKUP_ENABLED=true`
- `BACKUP_HOUR=2`
- `BACKUP_RETENTION_DAYS=30`
- `RATE_LIMIT_WINDOW_MS=60000`
- `RATE_LIMIT_MAX_REQUESTS=100`
- `LOG_LEVEL=info`

## Configuración en el Dashboard de Fly.io

### 1. Información Básica
- **Nombre de la aplicación**: `tienda-inventario` (o el que prefieras)
- **Organización**: Personal
- **Región**: 
  - `iad` - Ashburn, Virginia (recomendado para Latinoamérica)
  - `gru` - São Paulo, Brasil (más cercano a Colombia)
  - `mia` - Miami, Florida (buena opción)

### 2. Recursos de Máquina
- **CPU**: shared-cpu-1x (1 CPU compartida)
- **Memoria**: 256 MB (mínimo) o 512 MB (recomendado)

### 3. Puerto Interno
- **Puerto**: `3000`

### 4. Volumen de Datos
Antes de desplegar, crea un volumen:
- **Nombre**: `tienda_data`
- **Tamaño**: 1 GB
- **Región**: Misma que la aplicación

### 5. Variables de Entorno en Dashboard

Ve a: Dashboard → Tu App → Secrets

Agrega estas variables:

| Clave | Valor |
|-------|-------|
| `JWT_SECRET` | [Genera con el comando de arriba] |
| `ALLOWED_ORIGINS` | `https://tu-app.fly.dev` |

## Pasos para Desplegar desde Dashboard

1. **Conecta tu repositorio Git** (si usas GitHub/GitLab)
   - O sube el código manualmente

2. **Crea el volumen primero**:
   ```bash
   fly volumes create tienda_data --region iad --size 1
   ```

3. **Configura las variables secretas** en el dashboard

4. **Haz clic en "Deploy"**

## Verificación Post-Despliegue

1. Verifica que la app esté corriendo:
   ```bash
   fly status
   ```

2. Revisa los logs:
   ```bash
   fly logs
   ```

3. Prueba el health check:
   ```bash
   curl https://tu-app.fly.dev/api/health
   ```

4. Accede a la aplicación:
   ```
   https://tu-app.fly.dev
   ```

## Credenciales por Defecto

Después del primer despliegue, la base de datos se inicializará con:

- **Usuario Admin**:
  - Email: `admin@tienda.com`
  - Password: `admin123`

⚠️ **IMPORTANTE**: Cambia estas credenciales inmediatamente después del primer login.

## Monitoreo

- **Dashboard**: https://fly.io/dashboard/[tu-app]
- **Métricas**: https://fly.io/dashboard/[tu-app]/monitoring
- **Logs en vivo**: `fly logs -a tu-app`

## Costos Estimados

- Máquina (256MB): ~$2-3/mes
- Volumen (1GB): ~$0.15/mes
- **Total**: ~$2-4/mes

Con auto-stop habilitado, la app se detendrá cuando no haya tráfico y se iniciará automáticamente cuando llegue una petición.

## Soporte

Si tienes problemas:
1. Revisa los logs: `fly logs`
2. Accede por SSH: `fly ssh console`
3. Consulta la documentación: https://fly.io/docs/

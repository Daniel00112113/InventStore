# Guía de Despliegue en Fly.io

Esta guía te ayudará a desplegar tu aplicación de inventario en Fly.io.

## Requisitos Previos

1. Instalar Fly CLI:
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   
   # macOS/Linux
   curl -L https://fly.io/install.sh | sh
   ```

2. Crear cuenta en Fly.io:
   ```bash
   fly auth signup
   # o si ya tienes cuenta:
   fly auth login
   ```

## Configuración Inicial

### 1. Variables de Entorno Secretas

Configura las variables de entorno sensibles (NO las incluyas en fly.toml):

```bash
# JWT Secret (genera uno nuevo para producción)
fly secrets set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# CORS - Reemplaza con tu dominio real
fly secrets set ALLOWED_ORIGINS=https://tu-app.fly.dev,https://www.tu-dominio.com
```

### 2. Crear Volumen para Base de Datos

La base de datos SQLite necesita persistencia:

```bash
fly volumes create tienda_data --region iad --size 1
```

Regiones disponibles:
- `iad` - Ashburn, Virginia (Estados Unidos) - Recomendado para Latinoamérica
- `gru` - São Paulo, Brasil - Más cercano a Colombia
- `mia` - Miami, Florida (Estados Unidos) - Buena opción para Colombia

## Despliegue

### Primera vez:

```bash
# Lanzar la aplicación
fly launch --no-deploy

# Esto creará fly.toml automáticamente
# Edita fly.toml si es necesario

# Desplegar
fly deploy
```

### Despliegues posteriores:

```bash
fly deploy
```

## Configuración Recomendada para Producción

### En fly.toml:

```toml
app = "tienda-inventario"
primary_region = "iad"  # o "gru" para Brasil

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512  # Aumenta si es necesario

[mounts]
  source = "tienda_data"
  destination = "/data"
```

## Comandos Útiles

### Ver logs:
```bash
fly logs
```

### Acceder a la consola:
```bash
fly ssh console
```

### Ver estado:
```bash
fly status
```

### Escalar recursos:
```bash
# Aumentar memoria
fly scale memory 512

# Aumentar CPUs
fly scale count 2
```

### Backup de base de datos:
```bash
# Descargar backup
fly ssh sftp get /data/database.db ./backup-$(date +%Y%m%d).db
```

## Monitoreo

### Ver métricas:
```bash
fly dashboard
```

### Configurar alertas:
Visita https://fly.io/dashboard/[tu-app]/monitoring

## Solución de Problemas

### La app no inicia:
```bash
fly logs
fly ssh console
cd /app
npm run db:setup
```

### Base de datos corrupta:
```bash
fly ssh console
cd /data
rm database.db
cd /app
npm run db:setup
```

### Reiniciar la aplicación:
```bash
fly apps restart
```

## Costos Estimados

- Máquina compartida 1x CPU, 256MB RAM: ~$2-3/mes
- Volumen 1GB: ~$0.15/mes
- Total estimado: ~$2-4/mes (con auto-stop habilitado)

## Seguridad

1. Siempre usa HTTPS (configurado por defecto en Fly.io)
2. Configura ALLOWED_ORIGINS correctamente
3. Usa un JWT_SECRET fuerte y único
4. Habilita backups automáticos
5. Monitorea los logs regularmente

## Dominio Personalizado

Para usar tu propio dominio:

```bash
fly certs add tudominio.com
fly certs add www.tudominio.com
```

Luego configura los registros DNS:
- A record: @ -> [IP de Fly.io]
- CNAME: www -> tu-app.fly.dev

## Soporte

- Documentación: https://fly.io/docs/
- Comunidad: https://community.fly.io/
- Status: https://status.fly.io/

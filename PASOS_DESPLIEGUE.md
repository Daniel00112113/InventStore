# Pasos para Completar el Despliegue en Fly.io

## ✅ Completado hasta ahora:

1. ✅ Fly CLI instalado correctamente
2. ✅ Autenticado como: danieljzgomez0316@gmail.com
3. ✅ Código subido a GitHub
4. ✅ Archivos de configuración creados

## 📋 Pasos Siguientes:

### 1. Agregar Método de Pago
- Ve a: https://fly.io/dashboard/personal/billing
- Agrega una tarjeta de crédito
- **No te preocupes**: Fly.io tiene un tier gratuito generoso
- Solo te cobrarán si excedes los límites gratuitos

### 2. Lanzar la Aplicación

Después de agregar el método de pago, ejecuta:

```powershell
# Agregar fly al PATH (en cada nueva terminal)
$env:Path += ";$env:USERPROFILE\.fly\bin"

# Lanzar la app (sin desplegar todavía)
flyctl launch --no-deploy
```

### 3. Crear Volumen para Base de Datos

```powershell
flyctl volumes create tienda_data --region mia --size 1
```

Regiones recomendadas para Colombia:
- `mia` - Miami (más cercano)
- `iad` - Virginia
- `gru` - São Paulo

### 4. Configurar Secretos

```powershell
# Generar JWT_SECRET
$JWT_SECRET = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Configurar secretos
flyctl secrets set JWT_SECRET="$JWT_SECRET"
flyctl secrets set ALLOWED_ORIGINS="https://tienda-inventario.fly.dev"
```

### 5. Desplegar

```powershell
flyctl deploy
```

### 6. Verificar

```powershell
# Ver estado
flyctl status

# Ver logs
flyctl logs

# Abrir en navegador
flyctl open
```

## 🎯 Comandos Rápidos (Copia y Pega)

Una vez tengas el método de pago agregado, ejecuta esto:

```powershell
# 1. Configurar PATH
$env:Path += ";$env:USERPROFILE\.fly\bin"

# 2. Lanzar app
flyctl launch --no-deploy

# 3. Crear volumen
flyctl volumes create tienda_data --region mia --size 1

# 4. Configurar secretos
$JWT_SECRET = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
flyctl secrets set JWT_SECRET="$JWT_SECRET"
flyctl secrets set ALLOWED_ORIGINS="https://tienda-inventario.fly.dev"

# 5. Desplegar
flyctl deploy

# 6. Abrir app
flyctl open
```

## 💰 Límites del Tier Gratuito

Fly.io ofrece GRATIS:
- 3 máquinas compartidas con 256MB RAM
- 3GB de volumen persistente
- 160GB de transferencia de datos

Tu app usará:
- 1 máquina (256MB)
- 1GB de volumen
- Muy poca transferencia

**Costo estimado: $0/mes** (dentro del tier gratuito)

## 🔐 Credenciales de la App

Después del despliegue, accede con:
- **URL**: https://tienda-inventario.fly.dev
- **Email**: admin@tienda.com
- **Password**: admin123

⚠️ **IMPORTANTE**: Cambia la contraseña después del primer login.

## 📊 Monitoreo

- Dashboard: https://fly.io/dashboard/tienda-inventario
- Logs: `flyctl logs`
- Métricas: `flyctl status`

## 🆘 Si Algo Sale Mal

```powershell
# Ver logs detallados
flyctl logs

# Reiniciar app
flyctl apps restart

# Acceder por SSH
flyctl ssh console

# Ver volúmenes
flyctl volumes list

# Ver secretos
flyctl secrets list
```

## 📞 Soporte

- Documentación: https://fly.io/docs/
- Comunidad: https://community.fly.io/
- Status: https://status.fly.io/

---

**¡Estás a solo unos pasos de tener tu app en producción! 🚀**

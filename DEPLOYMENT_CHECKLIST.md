# ✅ Checklist de Despliegue en Fly.io

Usa este checklist para asegurar un despliegue exitoso.

## Pre-Despliegue

- [ ] Fly CLI instalado (`fly version`)
- [ ] Cuenta de Fly.io creada y autenticada (`fly auth login`)
- [ ] Node.js 18+ instalado localmente
- [ ] Código en Git (recomendado)

## Configuración Inicial

- [ ] Archivo `fly.toml` creado (ya incluido en el proyecto)
- [ ] Archivo `Dockerfile` optimizado (ya incluido)
- [ ] Variables de entorno revisadas en `.env.example`

## Crear Recursos en Fly.io

### 1. Volumen para Base de Datos
```bash
fly volumes create tienda_data --region iad --size 1
```
- [ ] Volumen creado exitosamente
- [ ] Región seleccionada (iad/gru/mia)

### 2. Configurar Secretos
```bash
# Generar JWT_SECRET
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
fly secrets set JWT_SECRET="$JWT_SECRET"

# Configurar CORS (reemplaza con tu dominio)
fly secrets set ALLOWED_ORIGINS="https://tu-app.fly.dev"
```
- [ ] JWT_SECRET configurado
- [ ] ALLOWED_ORIGINS configurado

## Despliegue

### Primera vez:
```bash
fly launch --no-deploy
# Revisa fly.toml generado
fly deploy
```
- [ ] App lanzada sin errores
- [ ] Despliegue completado

### Despliegues posteriores:
```bash
fly deploy
```

## Verificación Post-Despliegue

### 1. Estado de la App
```bash
fly status
```
- [ ] App en estado "running"
- [ ] Máquina activa

### 2. Logs
```bash
fly logs
```
- [ ] Sin errores críticos
- [ ] Base de datos inicializada
- [ ] Servidor escuchando en puerto 3000

### 3. Health Check
```bash
curl https://tu-app.fly.dev/api/health
```
- [ ] Respuesta: `{"status":"ok",...}`

### 4. Acceso Web
- [ ] Abrir `https://tu-app.fly.dev`
- [ ] Página de login carga correctamente
- [ ] Sin errores en consola del navegador

### 5. Login de Prueba
- [ ] Login con credenciales por defecto funciona
  - Email: `admin@tienda.com`
  - Password: `admin123`
- [ ] Dashboard carga correctamente
- [ ] Datos de prueba visibles

## Seguridad Post-Despliegue

- [ ] Cambiar contraseña del usuario admin
- [ ] Verificar que JWT_SECRET es único (no el del .env.example)
- [ ] ALLOWED_ORIGINS configurado con dominio real
- [ ] HTTPS funcionando (automático en Fly.io)

## Configuración Opcional

### Dominio Personalizado
```bash
fly certs add tudominio.com
fly certs add www.tudominio.com
```
- [ ] Certificados SSL agregados
- [ ] DNS configurado (A record o CNAME)
- [ ] Dominio funcionando

### Escalado
```bash
# Aumentar memoria si es necesario
fly scale memory 512

# Múltiples instancias
fly scale count 2
```
- [ ] Recursos ajustados según necesidad

### Monitoreo
- [ ] Dashboard de Fly.io revisado
- [ ] Alertas configuradas (opcional)
- [ ] Métricas monitoreadas

## Backup

### Configurar Backup Automático
```bash
# Descargar backup manual
fly ssh sftp get /data/database.db ./backup.db
```
- [ ] Backup manual probado
- [ ] Proceso de backup documentado

### Programar Backups Periódicos
- [ ] Script de backup creado
- [ ] Cron job o GitHub Action configurado (opcional)

## Documentación

- [ ] URL de producción documentada
- [ ] Credenciales de admin actualizadas
- [ ] Proceso de despliegue documentado para el equipo
- [ ] Contactos de soporte registrados

## Rollback (Si algo sale mal)

```bash
# Ver historial de despliegues
fly releases

# Volver a versión anterior
fly releases rollback
```
- [ ] Proceso de rollback probado (opcional)

## Costos

- [ ] Revisar uso de recursos en dashboard
- [ ] Confirmar que está dentro del tier gratuito o presupuesto
- [ ] Auto-stop habilitado para reducir costos

## Soporte

Si encuentras problemas:

1. Revisa logs: `fly logs`
2. Accede por SSH: `fly ssh console`
3. Consulta documentación: https://fly.io/docs/
4. Comunidad: https://community.fly.io/

---

## Resumen de Comandos Útiles

```bash
# Estado
fly status

# Logs en tiempo real
fly logs

# SSH
fly ssh console

# Reiniciar
fly apps restart

# Escalar
fly scale memory 512
fly scale count 2

# Backup
fly ssh sftp get /data/database.db ./backup.db

# Secretos
fly secrets list
fly secrets set KEY=value

# Volúmenes
fly volumes list
fly volumes create nombre --size 1

# Desplegar
fly deploy

# Rollback
fly releases rollback
```

---

**¡Listo!** Tu aplicación está desplegada en Fly.io 🚀

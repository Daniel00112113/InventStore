# 🔒 Guía de Seguridad - InvenStore

## Configuración Inicial

### 1. Variables de Entorno

Copia `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

### 2. Generar JWT_SECRET Seguro

**CRÍTICO:** Nunca uses el JWT_SECRET por defecto en producción.

Genera uno nuevo:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copia el resultado y actualiza `JWT_SECRET` en tu archivo `.env`.

### 3. Configurar CORS

En `.env`, configura los dominios permitidos:

**Desarrollo:**
```env
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Producción:**
```env
ALLOWED_ORIGINS=https://tudominio.com,https://www.tudominio.com
```

## Checklist de Seguridad para Producción

- [ ] JWT_SECRET único y fuerte (mínimo 64 caracteres)
- [ ] CORS configurado solo para dominios específicos
- [ ] NODE_ENV=production
- [ ] HTTPS habilitado
- [ ] Rate limiting configurado
- [ ] Logs de seguridad activos
- [ ] Backups automáticos configurados
- [ ] Contraseñas de usuarios fuertes
- [ ] Base de datos con permisos restringidos

## Características de Seguridad Implementadas

### ✅ Autenticación
- JWT con expiración de 24 horas
- Contraseñas hasheadas con bcrypt (10 rounds)
- Tokens almacenados en localStorage (considerar httpOnly cookies para mayor seguridad)

### ✅ Autorización
- Sistema de roles (admin, gerente, empleado)
- Middleware de validación de permisos
- Multi-tenancy con aislamiento por store_id

### ✅ Protección contra Ataques
- Rate limiting (100 req/min por IP)
- Validación de Content-Type
- Sanitización de inputs
- Headers de seguridad (X-Frame-Options, X-Content-Type-Options, etc.)
- Protección contra prototype pollution

### ✅ CORS
- Configuración restrictiva por entorno
- Whitelist de dominios permitidos

### ✅ Logging
- Registro de requests con errores
- Timestamps en todas las operaciones
- No se exponen detalles internos en producción

## Mejoras Recomendadas para Producción

### Alta Prioridad
1. **Migrar a PostgreSQL/MySQL** - SQLite no es ideal para producción multi-tenant
2. **Implementar HTTPS** - Usar Let's Encrypt o certificado SSL
3. **Cookies httpOnly** - Mover tokens de localStorage a cookies seguras
4. **Refresh Tokens** - Implementar sistema de refresh para mayor seguridad
5. **2FA** - Autenticación de dos factores para admins

### Media Prioridad
6. **Auditoría de logs** - Sistema de auditoría completo
7. **Encriptación de datos sensibles** - Encriptar datos en reposo
8. **WAF** - Web Application Firewall (Cloudflare, AWS WAF)
9. **Monitoreo** - Alertas de seguridad en tiempo real
10. **Backups encriptados** - Encriptar backups de base de datos

### Baja Prioridad
11. **CSP Headers** - Content Security Policy
12. **HSTS** - HTTP Strict Transport Security
13. **Subresource Integrity** - Para CDNs externos
14. **Rate limiting por usuario** - Además del rate limiting por IP

## Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, por favor NO la publiques públicamente.

Contacta al equipo de desarrollo directamente.

## Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

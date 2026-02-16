# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir al proyecto Tienda Barrio SaaS!

## 📋 Código de Conducta

Este proyecto se adhiere a un código de conducta. Al participar, se espera que mantengas este código.

## 🚀 Cómo Contribuir

### Reportar Bugs

Si encuentras un bug, por favor crea un issue con:

1. **Título descriptivo**
2. **Pasos para reproducir**
3. **Comportamiento esperado**
4. **Comportamiento actual**
5. **Screenshots** (si aplica)
6. **Entorno** (OS, Node version, etc.)

### Sugerir Mejoras

Para sugerir nuevas características:

1. Verifica que no exista un issue similar
2. Describe claramente la funcionalidad
3. Explica por qué sería útil
4. Proporciona ejemplos de uso

### Pull Requests

1. **Fork el repositorio**
```bash
git clone https://github.com/tu-usuario/tienda-barrio-saas.git
cd tienda-barrio-saas
```

2. **Crear rama feature**
```bash
git checkout -b feature/mi-nueva-funcionalidad
```

3. **Hacer cambios**
- Sigue las convenciones de código
- Agrega comentarios cuando sea necesario
- Mantén el código simple y legible

4. **Probar cambios**
```bash
npm run db:setup
npm run dev
# Ejecutar pruebas manuales
```

5. **Commit con mensaje descriptivo**
```bash
git commit -m "✨ Agregar funcionalidad X"
```

Prefijos de commit:
- `✨` Nuevas características
- `🐛` Corrección de bugs
- `📚` Documentación
- `🔧` Configuración
- `♻️` Refactorización
- `🎨` Mejoras de UI/UX
- `⚡` Performance
- `🔒` Seguridad

6. **Push a tu fork**
```bash
git push origin feature/mi-nueva-funcionalidad
```

7. **Crear Pull Request**
- Título claro y descriptivo
- Descripción detallada de cambios
- Referencias a issues relacionados
- Screenshots si hay cambios visuales

## 📝 Estándares de Código

### JavaScript

```javascript
// ✅ Bueno
async function loadProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// ❌ Malo
function loadProducts(){
const res=fetch(API_URL+'/products')
return res
}
```

### SQL

```sql
-- ✅ Bueno
SELECT 
  p.id,
  p.name,
  p.stock
FROM products p
WHERE p.store_id = ?
  AND p.active = 1
ORDER BY p.name;

-- ❌ Malo
select * from products where store_id=? and active=1
```

### CSS

```css
/* ✅ Bueno */
.metric-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
}

/* ❌ Malo */
.metric-card{background:white;padding:24px;border-radius:12px}
```

## 🧪 Testing

Antes de enviar un PR:

1. Prueba todas las funcionalidades afectadas
2. Verifica que no rompiste funcionalidad existente
3. Prueba en diferentes navegadores
4. Prueba en móvil
5. Verifica el modo oscuro

Ver [TESTING.md](TESTING.md) para guía completa.

## 📚 Documentación

Si agregas nuevas características:

1. Actualiza README.md
2. Agrega comentarios en el código
3. Actualiza CHANGELOG.md
4. Considera actualizar ARCHITECTURE.md

## 🎯 Áreas de Contribución

### Alta Prioridad
- Pruebas automatizadas
- Mejoras de performance
- Corrección de bugs
- Mejoras de seguridad

### Media Prioridad
- Nuevas características
- Mejoras de UI/UX
- Documentación
- Ejemplos

### Baja Prioridad
- Refactorización
- Optimizaciones menores
- Mejoras de código

## 🔍 Revisión de Código

Tu PR será revisado considerando:

1. **Funcionalidad:** ¿Funciona correctamente?
2. **Código:** ¿Es limpio y mantenible?
3. **Performance:** ¿Afecta el rendimiento?
4. **Seguridad:** ¿Introduce vulnerabilidades?
5. **Documentación:** ¿Está bien documentado?
6. **Tests:** ¿Está probado?

## 💡 Ideas de Contribución

### Backend
- [ ] Migración a PostgreSQL
- [ ] API de webhooks
- [ ] Rate limiting
- [ ] Logs estructurados
- [ ] Backups automáticos

### Frontend
- [ ] PWA (Progressive Web App)
- [ ] Gráficos con Chart.js
- [ ] Búsqueda avanzada
- [ ] Exportar a Excel/PDF
- [ ] Notificaciones push

### Infraestructura
- [ ] Docker compose
- [ ] CI/CD con GitHub Actions
- [ ] Tests automatizados
- [ ] Monitoreo con Prometheus
- [ ] Documentación API con Swagger

### Documentación
- [ ] Videos tutoriales
- [ ] Guía de usuario final
- [ ] API documentation
- [ ] Ejemplos de integración
- [ ] FAQ

## 📞 Contacto

¿Preguntas? Contáctanos:

- 📧 Email: dev@tiendabarrio.com
- 💬 Discord: [Servidor de Discord]
- 🐦 Twitter: [@tiendabarrio]

## 🙏 Agradecimientos

Gracias a todos los contribuidores que hacen este proyecto posible!

---

**¡Feliz coding!** 🎉

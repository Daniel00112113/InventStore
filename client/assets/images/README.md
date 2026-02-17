# 🎨 Carpeta de Imágenes y Logo

## 📁 Estructura

```
client/assets/images/
├── logo.svg          # Logo principal (SVG placeholder)
├── logo.png          # Logo en PNG (coloca tu logo aquí)
├── logo-dark.svg     # Logo para modo oscuro (opcional)
├── favicon.ico       # Favicon del sitio (opcional)
└── README.md         # Este archivo
```

## 🖼️ Cómo Agregar Tu Logo

### Opción 1: Reemplazar el SVG (Recomendado)

1. Guarda tu logo como `logo.svg` en esta carpeta
2. Reemplaza el archivo existente
3. El logo se mostrará automáticamente

**Ventajas del SVG**:
- ✅ Escalable sin pérdida de calidad
- ✅ Tamaño de archivo pequeño
- ✅ Se adapta a cualquier resolución
- ✅ Fácil de modificar colores

### Opción 2: Usar PNG

1. Guarda tu logo como `logo.png` en esta carpeta
2. Actualiza las referencias en `client/index.html`:
   - Busca: `src="assets/images/logo.svg"`
   - Reemplaza por: `src="assets/images/logo.png"`

**Recomendaciones para PNG**:
- Tamaño recomendado: 400x120 px (ancho x alto)
- Fondo transparente
- Formato: PNG-24 con transparencia
- Resolución: 72-144 DPI

### Opción 3: Usar JPG

1. Guarda tu logo como `logo.jpg` en esta carpeta
2. Actualiza las referencias en `client/index.html`
3. **Nota**: JPG no soporta transparencia

## 📐 Especificaciones del Logo

### Logo Principal (Navbar)
- **Altura**: 40px (se ajusta automáticamente)
- **Ancho**: Proporcional
- **Formato**: SVG, PNG, o JPG
- **Ubicación**: Navbar superior

### Logo de Login
- **Ancho máximo**: 200px
- **Altura**: Proporcional
- **Formato**: SVG, PNG, o JPG
- **Ubicación**: Pantalla de login

## 🎨 Modo Oscuro (Opcional)

Si quieres un logo diferente para modo oscuro:

1. Crea `logo-dark.svg` o `logo-dark.png`
2. Agrega este código en `client/app.js`:

```javascript
function updateLogo() {
    const isDark = document.body.classList.contains('dark-mode');
    const logoSrc = isDark ? 'assets/images/logo-dark.svg' : 'assets/images/logo.svg';
    
    document.querySelectorAll('.logo-image, .navbar-logo').forEach(img => {
        img.src = logoSrc;
    });
}

// Llamar cuando cambie el modo
darkModeToggle.addEventListener('click', () => {
    // ... código existente ...
    updateLogo();
});
```

## 🌐 Favicon (Opcional)

Para agregar un favicon:

1. Crea `favicon.ico` (16x16 o 32x32 px)
2. Agrega en `<head>` de `client/index.html`:

```html
<link rel="icon" type="image/x-icon" href="assets/images/favicon.ico">
```

O usa PNG:

```html
<link rel="icon" type="image/png" href="assets/images/favicon.png">
```

## 🛠️ Herramientas Recomendadas

### Para Crear/Editar Logos:
- **Figma** (gratis, online): https://figma.com
- **Canva** (gratis, online): https://canva.com
- **Inkscape** (gratis, desktop): https://inkscape.org
- **Adobe Illustrator** (pago)

### Para Convertir Formatos:
- **CloudConvert**: https://cloudconvert.com
- **Convertio**: https://convertio.co
- **SVGOMG** (optimizar SVG): https://jakearchibald.github.io/svgomg/

### Para Crear Favicon:
- **Favicon.io**: https://favicon.io
- **RealFaviconGenerator**: https://realfavicongenerator.net

## 📝 Ejemplos de Código

### Cambiar Logo en HTML

```html
<!-- Logo en Login -->
<div class="login-logo">
    <img src="assets/images/logo.svg" alt="InvenStore Logo" class="logo-image">
</div>

<!-- Logo en Navbar -->
<div class="navbar-brand">
    <img src="assets/images/logo.svg" alt="InvenStore Logo" class="navbar-logo">
    <h2>InvenStore</h2>
</div>
```

### Estilos CSS Personalizados

```css
/* Ajustar tamaño del logo en navbar */
.navbar-logo {
    height: 50px; /* Cambiar altura */
    width: auto;
}

/* Ajustar tamaño del logo en login */
.logo-image {
    max-width: 250px; /* Cambiar ancho máximo */
    height: auto;
}

/* Agregar efecto hover */
.navbar-logo:hover {
    transform: scale(1.05);
    transition: transform 0.3s ease;
}
```

## ✅ Checklist

- [ ] Logo agregado en `client/assets/images/`
- [ ] Referencias actualizadas en `client/index.html` (si es necesario)
- [ ] Logo se ve bien en pantalla de login
- [ ] Logo se ve bien en navbar
- [ ] Logo se ve bien en modo oscuro
- [ ] Logo se ve bien en móvil
- [ ] Favicon agregado (opcional)
- [ ] Logo optimizado (tamaño de archivo pequeño)

## 🚀 Resultado

Después de agregar tu logo:

1. **Login**: Tu logo aparecerá centrado arriba del formulario
2. **Navbar**: Tu logo aparecerá en la esquina superior izquierda
3. **Responsive**: El logo se ajustará automáticamente en móviles

## 📞 Soporte

Si tienes problemas:

1. Verifica que el archivo esté en la carpeta correcta
2. Verifica que el nombre del archivo coincida con el HTML
3. Limpia el caché del navegador (Ctrl + Shift + R)
4. Verifica la consola del navegador (F12) por errores

---

**Ubicación actual**: `client/assets/images/`  
**Última actualización**: Febrero 2026

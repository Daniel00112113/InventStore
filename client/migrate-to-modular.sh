#!/bin/bash

# Script para migrar a la versión modular del cliente
# Uso: bash migrate-to-modular.sh [backup|activate|rollback]

set -e

BACKUP_DIR="client-backup-$(date +%Y%m%d-%H%M%S)"

backup() {
    echo "📦 Creando backup de archivos originales..."
    mkdir -p "$BACKUP_DIR"
    cp index.html "$BACKUP_DIR/"
    cp app.js "$BACKUP_DIR/"
    echo "✅ Backup creado en: $BACKUP_DIR"
}

activate() {
    echo "🚀 Activando versión modular..."
    
    # Verificar que existen los archivos modulares
    if [ ! -f "app-modular.js" ]; then
        echo "❌ Error: app-modular.js no encontrado"
        echo "💡 Asegúrate de ejecutar este script desde el directorio client/"
        exit 1
    fi
    
    if [ ! -f "index-modular.html" ]; then
        echo "❌ Error: index-modular.html no encontrado"
        echo "💡 Asegúrate de ejecutar este script desde el directorio client/"
        exit 1
    fi
    
    # Crear backup automático
    backup
    
    # Renombrar archivos originales
    mv index.html index-legacy.html
    mv app.js app-legacy.js
    
    # Activar versión modular
    cp index-modular.html index.html
    
    echo "✅ Versión modular activada"
    echo "📝 Archivos legacy guardados como:"
    echo "   - index-legacy.html"
    echo "   - app-legacy.js"
    echo "📦 Backup completo en: $BACKUP_DIR"
}

rollback() {
    echo "⏪ Restaurando versión original..."
    
    if [ ! -f "index-legacy.html" ]; then
        echo "❌ Error: No se encontraron archivos legacy"
        echo "💡 Restaura desde el backup manualmente"
        exit 1
    fi
    
    # Restaurar archivos originales
    mv index-legacy.html index.html
    mv app-legacy.js app.js
    
    echo "✅ Versión original restaurada"
}

case "$1" in
    backup)
        backup
        ;;
    activate)
        activate
        ;;
    rollback)
        rollback
        ;;
    *)
        echo "Uso: $0 {backup|activate|rollback}"
        echo ""
        echo "Comandos:"
        echo "  backup   - Crear backup de archivos actuales"
        echo "  activate - Activar versión modular (crea backup automático)"
        echo "  rollback - Restaurar versión original"
        exit 1
        ;;
esac

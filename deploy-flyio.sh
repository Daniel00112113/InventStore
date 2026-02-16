#!/bin/bash

# Script de despliegue para Fly.io
# Uso: ./deploy-flyio.sh [comando]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Script de Despliegue Fly.io${NC}"
echo ""

# Verificar que fly CLI está instalado
if ! command -v fly &> /dev/null; then
    echo -e "${RED}❌ Fly CLI no está instalado${NC}"
    echo "Instala con: curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Función para configurar secretos
setup_secrets() {
    echo -e "${YELLOW}🔐 Configurando secretos...${NC}"
    
    # Generar JWT_SECRET si no existe
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    fly secrets set JWT_SECRET="$JWT_SECRET"
    
    # Solicitar dominio para CORS
    read -p "Ingresa tu dominio (ej: https://tu-app.fly.dev): " DOMAIN
    fly secrets set ALLOWED_ORIGINS="$DOMAIN"
    
    echo -e "${GREEN}✅ Secretos configurados${NC}"
}

# Función para crear volumen
create_volume() {
    echo -e "${YELLOW}💾 Creando volumen para base de datos...${NC}"
    
    read -p "Selecciona región (iad/gru/mia) [iad]: " REGION
    REGION=${REGION:-iad}
    
    fly volumes create tienda_data --region "$REGION" --size 1
    
    echo -e "${GREEN}✅ Volumen creado${NC}"
}

# Función para desplegar
deploy() {
    echo -e "${YELLOW}🚢 Desplegando aplicación...${NC}"
    fly deploy
    echo -e "${GREEN}✅ Despliegue completado${NC}"
}

# Función para ver logs
logs() {
    echo -e "${YELLOW}📋 Mostrando logs...${NC}"
    fly logs
}

# Función para backup
backup() {
    echo -e "${YELLOW}💾 Descargando backup de base de datos...${NC}"
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).db"
    fly ssh sftp get /data/database.db "./$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup guardado en: $BACKUP_FILE${NC}"
}

# Función para setup inicial
initial_setup() {
    echo -e "${YELLOW}🎯 Setup inicial de Fly.io${NC}"
    
    # Verificar si ya está autenticado
    if ! fly auth whoami &> /dev/null; then
        echo "Necesitas autenticarte primero"
        fly auth login
    fi
    
    # Crear volumen
    create_volume
    
    # Configurar secretos
    setup_secrets
    
    # Primer despliegue
    echo -e "${YELLOW}🚀 Realizando primer despliegue...${NC}"
    fly launch --no-deploy
    fly deploy
    
    echo -e "${GREEN}✅ Setup completado!${NC}"
    echo -e "Tu app está disponible en: $(fly status --json | grep hostname)"
}

# Menú principal
case "${1:-menu}" in
    setup)
        initial_setup
        ;;
    secrets)
        setup_secrets
        ;;
    volume)
        create_volume
        ;;
    deploy)
        deploy
        ;;
    logs)
        logs
        ;;
    backup)
        backup
        ;;
    status)
        fly status
        ;;
    ssh)
        fly ssh console
        ;;
    restart)
        fly apps restart
        ;;
    menu|*)
        echo "Comandos disponibles:"
        echo "  setup    - Setup inicial completo"
        echo "  secrets  - Configurar variables secretas"
        echo "  volume   - Crear volumen para base de datos"
        echo "  deploy   - Desplegar aplicación"
        echo "  logs     - Ver logs"
        echo "  backup   - Descargar backup de BD"
        echo "  status   - Ver estado de la app"
        echo "  ssh      - Conectar por SSH"
        echo "  restart  - Reiniciar aplicación"
        echo ""
        echo "Uso: ./deploy-flyio.sh [comando]"
        ;;
esac

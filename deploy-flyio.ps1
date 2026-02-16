# Script de despliegue para Fly.io (PowerShell)
# Uso: .\deploy-flyio.ps1 [comando]

param(
    [Parameter(Position=0)]
    [string]$Command = "menu"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Script de Despliegue Fly.io" -ForegroundColor Green
Write-Host ""

# Verificar que fly CLI está instalado
if (-not (Get-Command fly -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Fly CLI no está instalado" -ForegroundColor Red
    Write-Host "Instala con: iwr https://fly.io/install.ps1 -useb | iex"
    exit 1
}

# Función para configurar secretos
function Setup-Secrets {
    Write-Host "🔐 Configurando secretos..." -ForegroundColor Yellow
    
    # Generar JWT_SECRET
    $JWT_SECRET = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    fly secrets set "JWT_SECRET=$JWT_SECRET"
    
    # Solicitar dominio para CORS
    $DOMAIN = Read-Host "Ingresa tu dominio (ej: https://tu-app.fly.dev)"
    fly secrets set "ALLOWED_ORIGINS=$DOMAIN"
    
    Write-Host "✅ Secretos configurados" -ForegroundColor Green
}

# Función para crear volumen
function Create-Volume {
    Write-Host "💾 Creando volumen para base de datos..." -ForegroundColor Yellow
    
    $REGION = Read-Host "Selecciona región (iad/gru/mia) [iad]"
    if ([string]::IsNullOrEmpty($REGION)) { $REGION = "iad" }
    
    fly volumes create tienda_data --region $REGION --size 1
    
    Write-Host "✅ Volumen creado" -ForegroundColor Green
}

# Función para desplegar
function Deploy-App {
    Write-Host "🚢 Desplegando aplicación..." -ForegroundColor Yellow
    fly deploy
    Write-Host "✅ Despliegue completado" -ForegroundColor Green
}

# Función para ver logs
function Show-Logs {
    Write-Host "📋 Mostrando logs..." -ForegroundColor Yellow
    fly logs
}

# Función para backup
function Backup-Database {
    Write-Host "💾 Descargando backup de base de datos..." -ForegroundColor Yellow
    $BACKUP_FILE = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').db"
    fly ssh sftp get /data/database.db "./$BACKUP_FILE"
    Write-Host "✅ Backup guardado en: $BACKUP_FILE" -ForegroundColor Green
}

# Función para setup inicial
function Initial-Setup {
    Write-Host "🎯 Setup inicial de Fly.io" -ForegroundColor Yellow
    
    # Verificar autenticación
    try {
        fly auth whoami | Out-Null
    } catch {
        Write-Host "Necesitas autenticarte primero"
        fly auth login
    }
    
    # Crear volumen
    Create-Volume
    
    # Configurar secretos
    Setup-Secrets
    
    # Primer despliegue
    Write-Host "🚀 Realizando primer despliegue..." -ForegroundColor Yellow
    fly launch --no-deploy
    fly deploy
    
    Write-Host "✅ Setup completado!" -ForegroundColor Green
    $status = fly status --json | ConvertFrom-Json
    Write-Host "Tu app está disponible en: https://$($status.Hostname)"
}

# Menú principal
switch ($Command) {
    "setup" {
        Initial-Setup
    }
    "secrets" {
        Setup-Secrets
    }
    "volume" {
        Create-Volume
    }
    "deploy" {
        Deploy-App
    }
    "logs" {
        Show-Logs
    }
    "backup" {
        Backup-Database
    }
    "status" {
        fly status
    }
    "ssh" {
        fly ssh console
    }
    "restart" {
        fly apps restart
    }
    default {
        Write-Host "Comandos disponibles:"
        Write-Host "  setup    - Setup inicial completo"
        Write-Host "  secrets  - Configurar variables secretas"
        Write-Host "  volume   - Crear volumen para base de datos"
        Write-Host "  deploy   - Desplegar aplicación"
        Write-Host "  logs     - Ver logs"
        Write-Host "  backup   - Descargar backup de BD"
        Write-Host "  status   - Ver estado de la app"
        Write-Host "  ssh      - Conectar por SSH"
        Write-Host "  restart  - Reiniciar aplicación"
        Write-Host ""
        Write-Host "Uso: .\deploy-flyio.ps1 [comando]"
    }
}

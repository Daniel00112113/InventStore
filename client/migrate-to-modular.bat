@echo off
REM Script para migrar a la versión modular del cliente (Windows)
REM Uso: migrate-to-modular.bat [backup|activate|rollback]

setlocal enabledelayedexpansion

set BACKUP_DIR=client-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%

if "%1"=="backup" goto backup
if "%1"=="activate" goto activate
if "%1"=="rollback" goto rollback
goto usage

:backup
echo 📦 Creando backup de archivos originales...
mkdir "%BACKUP_DIR%" 2>nul
copy index.html "%BACKUP_DIR%\" >nul
copy app.js "%BACKUP_DIR%\" >nul
echo ✅ Backup creado en: %BACKUP_DIR%
goto end

:activate
echo 🚀 Activando versión modular...

REM Verificar que existen los archivos modulares
if not exist "app-modular.js" (
    echo ❌ Error: app-modular.js no encontrado
    echo 💡 Asegúrate de ejecutar este script desde el directorio client\
    exit /b 1
)

if not exist "index-modular.html" (
    echo ❌ Error: index-modular.html no encontrado
    echo 💡 Asegúrate de ejecutar este script desde el directorio client\
    exit /b 1
)

REM Crear backup automático
call :backup

REM Renombrar archivos originales
move index.html index-legacy.html >nul
move app.js app-legacy.js >nul

REM Activar versión modular
copy index-modular.html index.html >nul

echo ✅ Versión modular activada
echo 📝 Archivos legacy guardados como:
echo    - index-legacy.html
echo    - app-legacy.js
echo 📦 Backup completo en: %BACKUP_DIR%
goto end

:rollback
echo ⏪ Restaurando versión original...

if not exist "index-legacy.html" (
    echo ❌ Error: No se encontraron archivos legacy
    echo 💡 Restaura desde el backup manualmente
    exit /b 1
)

REM Restaurar archivos originales
move index-legacy.html index.html >nul
move app-legacy.js app.js >nul

echo ✅ Versión original restaurada
goto end

:usage
echo Uso: %0 {backup^|activate^|rollback}
echo.
echo Comandos:
echo   backup   - Crear backup de archivos actuales
echo   activate - Activar versión modular (crea backup automático)
echo   rollback - Restaurar versión original
exit /b 1

:end
endlocal

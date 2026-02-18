# Script para reiniciar el servidor
Write-Host "🔄 Reiniciando servidor..."

# Matar cualquier proceso en el puerto 3000
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($processes) {
    foreach ($process in $processes) {
        $pid = $process.OwningProcess
        Write-Host "🔪 Matando proceso $pid en puerto 3000"
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}

# Esperar un momento
Start-Sleep -Seconds 2

# Iniciar el servidor
Write-Host "🚀 Iniciando servidor..."
Set-Location $PSScriptRoot
$env:NODE_ENV = "development"
node server/index.js
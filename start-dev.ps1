# Function to check if a port is in use
function Test-PortInUse {
    param($port)
    
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    return [bool]$connection
}

# Function to kill process using a port
function Stop-ProcessByPort {
    param($port)
    
    $processId = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess
    if ($processId) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Write-Host "Killed process using port $port"
    }
}

Write-Host "🚀 Starting Vettly development environment..." -ForegroundColor Cyan

# 1. Kill any existing Node.js processes
Write-Host "Cleaning up existing Node.js processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 2. Check and kill process using port 3001
Write-Host "Checking port 3001..." -ForegroundColor Yellow
if (Test-PortInUse 3001) {
    Write-Host "Port 3001 is in use. Killing process..." -ForegroundColor Red
    Stop-ProcessByPort 3001
    Start-Sleep -Seconds 2
}

# 3. Clean up Next.js cache
Write-Host "Cleaning Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item ".next" -Recurse -Force
}

# 4. Clean npm cache
Write-Host "Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force

# 5. Remove node_modules/.cache
Write-Host "Cleaning node_modules cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item "node_modules\.cache" -Recurse -Force
}

# 6. Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# 7. Set environment variables
$env:NODE_ENV = "development"
$env:PORT = "3001"
$env:HOSTNAME = "localhost"

# 8. Start the development server
Write-Host "Starting development server..." -ForegroundColor Green
npm run dev 
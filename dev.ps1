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
        Write-Host "Killed process using port $port" -ForegroundColor Yellow
    }
}

# Function to clean development environment
function Clear-DevEnvironment {
    Write-Host "🧹 Cleaning development environment..." -ForegroundColor Cyan

    # Kill any existing Node.js processes
    Write-Host "Cleaning up existing Node.js processes..." -ForegroundColor Yellow
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 1

    # Check and kill process using ports
    @(3000, 3001) | ForEach-Object {
        Write-Host "Checking port $_..." -ForegroundColor Yellow
        if (Test-PortInUse $_) {
            Write-Host "Port $_ is in use. Killing process..." -ForegroundColor Red
            Stop-ProcessByPort $_
        }
    }

    # Clean up Next.js cache
    if (Test-Path ".next") {
        Write-Host "Cleaning Next.js cache..." -ForegroundColor Yellow
        Remove-Item ".next" -Recurse -Force
    }

    # Clean node_modules cache
    if (Test-Path "node_modules\.cache") {
        Write-Host "Cleaning node_modules cache..." -ForegroundColor Yellow
        Remove-Item "node_modules\.cache" -Recurse -Force
    }
}

# Function to ensure dependencies
function Install-Dependencies {
    # Install dependencies if node_modules doesn't exist
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
        npm install
    }
}

# Main script
$ErrorActionPreference = "Stop"

# Parse command line arguments
param(
    [switch]$Clean,
    [switch]$Production
)

try {
    Write-Host "🚀 Starting Vettly..." -ForegroundColor Cyan

    if ($Clean) {
        Clear-DevEnvironment
        npm cache clean --force
    }

    Install-Dependencies

    # Set environment variables
    $env:NODE_ENV = if ($Production) { "production" } else { "development" }
    $env:PORT = "3000"
    $env:HOST = "localhost"

    # Start the server
    Write-Host "🌐 Starting server in $($env:NODE_ENV) mode..." -ForegroundColor Cyan
    if ($Production) {
        npm run build
        npm run start
    } else {
        npm run dev
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

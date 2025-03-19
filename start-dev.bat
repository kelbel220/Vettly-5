@echo off
echo Starting development environment setup...

REM Kill any existing node processes
echo Cleaning up existing Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Clear port 3000
echo Clearing port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak >nul

REM Clean up Next.js cache
echo Cleaning Next.js cache...
if exist ".next" (
    rmdir /s /q ".next"
)

REM Clean npm cache
echo Cleaning npm cache...
call npm cache clean --force

REM Remove node_modules/.cache
echo Cleaning node_modules cache...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Start the development server with specific host and port
echo Starting development server...
call npm run dev

pause 
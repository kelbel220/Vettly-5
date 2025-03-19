@echo off
echo Cleaning up previous processes...

REM Kill any existing node processes
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Clear port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak >nul

REM Clean up Next.js cache
if exist ".next" (
    echo Removing .next directory...
    rmdir /s /q ".next"
)

REM Clean npm cache
echo Cleaning npm cache...
call npm cache clean --force

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Start the development server
echo Starting development server...
call npm run dev

pause 
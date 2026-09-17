@echo off
cd /d "%~dp0"

TITLE MINDORA - Central Server Launcher
COLOR 0B
CLS

echo ============================================================
echo   MINDORA - MICROBIOLOGY EXHIBITION SYSTEM
echo ============================================================
echo.

echo [1/5] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js v18 or higher from https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [2/5] Checking root dependencies...
if not exist "node_modules\" (
    echo Installing root dependencies...
    call npm install
)

echo [3/5] Checking client dependencies and build...
if not exist "client\node_modules\" (
    echo Installing client dependencies...
    cd client
    call npm install
    cd /d "%~dp0"
)

if not exist "client\dist\" (
    echo Building frontend application...
    call npm run build:client
)

echo [4/5] Checking MongoDB Database service...
netstat -aon | findstr ":27017" >nul 2>nul
if %errorlevel% neq 0 (
    echo MongoDB is not listening on port 27017. Attempting to start MongoDB service...
    net start MongoDB >nul 2>nul
    if %errorlevel% neq 0 (
        echo.
        echo [WARNING] Could not start MongoDB automatically.
        echo If database connection fails, please right-click this script and choose Run as administrator.
        echo.
    )
) else (
    echo MongoDB service is active.
)

echo [5/5] Clearing port 3000 and starting MINDORA Server...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Stopping old server process PID %%a...
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo Launching browser at http://localhost:3000...
start "" http://localhost:3000

echo Starting server...
node server/server.js
echo.
echo Server stopped.
pause

@echo off
cd /d "%~dp0"

TITLE MINDORA Desktop Application
COLOR 0A
CLS

echo ============================================================
echo   MINDORA - DESKTOP APPLICATION LAUNCHER
echo ============================================================
echo.

echo [1/4] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [2/4] Checking dependencies and build...
if not exist "node_modules\" (
    echo Installing root dependencies...
    call npm install
)

if not exist "client\dist\" (
    echo Building frontend application...
    call npm run build:client
)

echo [3/4] Checking MongoDB Database service...
netstat -aon | findstr ":27017" >nul 2>nul
if %errorlevel% neq 0 (
    echo Starting MongoDB service...
    net start MongoDB >nul 2>nul
)

echo [4/4] Launching MINDORA Standalone Desktop App...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

start "" node server/server.js

:: Wait 2 seconds for Express server to start listening
ping 127.0.0.1 -n 3 >nul

:: Launch Microsoft Edge in standalone App Mode
where msedge >nul 2>nul
if %errorlevel%==0 (
    start "" msedge --app=http://localhost:3000 --window-size=1280,850
    exit /b 0
)

:: Fallback to Google Chrome in standalone App Mode
where chrome >nul 2>nul
if %errorlevel%==0 (
    start "" chrome --app=http://localhost:3000 --window-size=1280,850
    exit /b 0
)

:: Fallback to default browser
start "" http://localhost:3000

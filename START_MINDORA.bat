@echo off
TITLE MINDORA ? Microbiology Exhibition Server
COLOR 0B
CLS

echo ============================================================
echo   MINDORA ? MICROBIOLOGY EXHIBITION OFFLINE LAN SYSTEM
echo ============================================================
echo.

echo [1/3] Checking Node.js runtime...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    pause
    exit /b 1
)

echo [2/3] Checking MongoDB Database service...
sc query MongoDB | find /i "RUNNING" >nul 2>nul
if %errorlevel% neq 0 (
    echo Starting MongoDB service...
    net start MongoDB >nul 2>nul
)

echo [3/3] Launching MINDORA Offline Central Server...
echo.

start "" http://localhost:3000

node server/server.js
pause

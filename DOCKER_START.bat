@echo off
TITLE MINDORA Docker Launcher
COLOR 0A
CLS

echo ============================================================
echo   MINDORA — MICROBIOLOGY EXHIBITION DOCKER LAUNCHER
echo ============================================================
echo.

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or Docker Desktop is not running!
    echo Please install Docker Desktop or start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Starting MINDORA Containers via Docker Compose...
docker compose up -d --build

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Docker containers.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   MINDORA IS RUNNING IN DOCKER!
echo   Open in browser: http://localhost:3000
echo ============================================================
echo.

start "" http://localhost:3000
pause

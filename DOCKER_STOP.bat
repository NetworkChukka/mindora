@echo off
TITLE MINDORA Docker Stop
COLOR 0C
CLS

echo ============================================================
echo   STOPPING MINDORA DOCKER CONTAINERS
echo ============================================================
echo.

docker compose down

echo.
echo MINDORA Docker containers stopped successfully.
echo Data remains saved safely in Docker volume 'mindora-mongo-data'.
echo.
pause

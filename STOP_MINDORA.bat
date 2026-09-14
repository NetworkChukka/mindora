@echo off
TITLE Stop MINDORA Server
COLOR 0C
CLS

echo ============================================================
echo   STOPPING MINDORA SERVER
echo ============================================================
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Terminating server process PID %%a on port 3000...
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo MINDORA server stopped successfully.
echo.
pause

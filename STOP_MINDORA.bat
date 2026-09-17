@echo off
cd /d "%~dp0"
TITLE Stop MINDORA Server
COLOR 0C
CLS

echo ============================================================
echo   STOPPING MINDORA SERVER
echo ============================================================
echo.

set FOUND=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Terminating server process PID %%a on port 3000...
    taskkill /F /PID %%a >nul 2>nul
    set FOUND=1
)

echo.
if %FOUND%==1 (
    echo MINDORA server stopped successfully.
) else (
    echo No running MINDORA server instance found on port 3000.
)
echo.
pause

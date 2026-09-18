@echo off
cd /d "%~dp0"
TITLE Build MINDORA.exe

echo Compiling native MINDORA.exe...
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /out:MINDORA.exe /r:System.Windows.Forms.dll /r:System.dll desktop\Launcher.cs

if %errorlevel%==0 (
    echo.
    echo SUCCESS: MINDORA.exe generated successfully!
) else (
    echo.
    echo ERROR: Failed to compile MINDORA.exe.
)
pause

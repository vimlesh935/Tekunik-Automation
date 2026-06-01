@echo off
echo.
echo ╔════════════════════════════════════════╗
echo ║   KILLING PROCESS ON PORT 8787       ║
echo ╚════════════════════════════════════════╝
echo.

REM Find process using port 8787
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8787 ^| findstr LISTENING') do (
    set PID=%%a
)

if defined PID (
    echo Found process using port 8787: PID %PID%
    echo Killing process...
    taskkill /F /PID %PID% >nul 2>&1
    if errorlevel 1 (
        echo ❌ Failed to kill process
        echo Try running as Administrator
    ) else (
        echo ✅ Process killed successfully
        timeout /t 2 /nobreak >nul
    )
) else (
    echo ✅ Port 8787 is free
)

echo.
echo Port 8787 is now available!
echo.

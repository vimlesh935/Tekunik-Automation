@echo off
echo.
echo ╔════════════════════════════════════════╗
echo ║   BACKEND SERVER - SAFE START        ║
echo ╚════════════════════════════════════════╝
echo.

REM Step 1: Check and kill any process on port 8787
echo [1/3] Checking port 8787...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8787 ^| findstr LISTENING') do (
    echo ⚠️  Port 8787 is in use by PID %%a
    echo Killing process...
    taskkill /F /PID %%a >nul 2>&1
    if errorlevel 1 (
        echo ❌ Failed to kill process. Try running as Administrator.
        pause
        exit /b 1
    ) else (
        echo ✅ Process killed successfully
        timeout /t 2 /nobreak >nul
    )
)
echo ✅ Port 8787 is available
echo.

REM Step 2: Check MySQL
echo [2/3] Checking MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ MySQL is running
) else (
    echo ❌ MySQL is NOT running!
    echo Please start MySQL in XAMPP Control Panel
    pause
    exit /b 1
)
echo.

REM Step 3: Start server
echo [3/3] Starting backend server...
echo.
echo ╔════════════════════════════════════════╗
echo ║  Starting on http://localhost:8787   ║
echo ╚════════════════════════════════════════╝
echo.
echo Press Ctrl+C to stop the server
echo.

node server.js

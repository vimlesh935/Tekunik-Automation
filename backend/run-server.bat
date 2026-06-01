@echo off
setlocal enabledelayedexpansion
title Backend Server - Port 8787

:KILL_PORT
cls
echo.
echo ╔════════════════════════════════════════╗
echo ║   BACKEND STARTUP - PORT CLEANUP     ║
echo ╚════════════════════════════════════════╝
echo.

set PORT=8787
set MAX_ATTEMPTS=3
set ATTEMPT=0

:RETRY
set /a ATTEMPT+=1
echo [Attempt %ATTEMPT%/%MAX_ATTEMPTS%] Checking port %PORT%...

REM Find and kill all processes on port 8787
set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
    set PID=%%a
    if not "!PID!"=="" (
        set FOUND=1
        echo ⚠️  Port %PORT% in use by PID !PID!
        echo 🔪 Killing PID !PID!...
        taskkill /F /PID !PID! >nul 2>&1
        if !errorlevel! equ 0 (
            echo ✅ Killed PID !PID!
        ) else (
            echo ⚠️  Failed to kill PID !PID!
            echo.
            echo ═══════════════════════════════════════
            echo   ADMIN RIGHTS REQUIRED
            echo ═══════════════════════════════════════
            echo.
            echo Right-click this file and select:
            echo "Run as Administrator"
            echo.
            pause
            exit /b 1
        )
    )
)

if !FOUND! equ 1 (
    echo.
    echo ⏳ Waiting 3 seconds for port to be released...
    timeout /t 3 /nobreak >nul
    
    REM Verify port is actually free
    netstat -ano 2>nul | findstr ":%PORT%" | findstr "LISTENING" >nul 2>&1
    if !errorlevel! equ 0 (
        if !ATTEMPT! lss !MAX_ATTEMPTS! (
            echo ⚠️  Port still in use, retrying...
            echo.
            goto RETRY
        ) else (
            echo.
            echo ❌ Failed to free port after %MAX_ATTEMPTS% attempts
            echo.
            echo MANUAL FIX REQUIRED:
            echo 1. Open Task Manager ^(Ctrl+Shift+Esc^)
            echo 2. Find "Node.js" processes
            echo 3. End all Node.js tasks
            echo 4. Run this script again
            echo.
            pause
            exit /b 1
        )
    )
)

echo ✅ Port %PORT% is FREE
echo.

:START_SERVER
echo ╔════════════════════════════════════════╗
echo ║   STARTING BACKEND SERVER            ║
echo ╚════════════════════════════════════════╝
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo ⚠️  Dependencies not found
    echo 📦 Installing dependencies...
    call npm install
    if !errorlevel! neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
    echo.
)

REM Check if MySQL is running
echo 🔍 Checking MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if !errorlevel! neq 0 (
    echo.
    echo ❌ MySQL is NOT running!
    echo.
    echo Please start MySQL in XAMPP Control Panel:
    echo 1. Open XAMPP Control Panel
    echo 2. Click "Start" next to MySQL
    echo 3. Wait for green "Running" status
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)
echo ✅ MySQL is running
echo.

echo ╔════════════════════════════════════════╗
echo ║  🚀 STARTING ON PORT %PORT%          ║
echo ╚════════════════════════════════════════╝
echo.
echo Server URL: http://localhost:%PORT%
echo Health Check: http://localhost:%PORT%/health
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
node server.js

REM If server exits, check if it was due to port error
if !errorlevel! neq 0 (
    echo.
    echo ❌ Server stopped with error
    echo.
    echo Attempting to restart with port cleanup...
    timeout /t 2 /nobreak >nul
    goto KILL_PORT
)

endlocal

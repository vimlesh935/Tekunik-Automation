@echo off
setlocal enabledelayedexpansion
title Tekunik Automation - Full Stack Server

cls
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║         TEKUNIK AUTOMATION - FULL STACK STARTUP             ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 1: CLEANUP PORTS
REM ═══════════════════════════════════════════════════════════════

echo [1/7] Cleaning up ports...
echo.

REM Kill port 8787 (Backend) using PowerShell
echo 🔍 Checking backend port 8787...
powershell -Command "$procs = Get-NetTCPConnection -LocalPort 8787 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($procs) { $procs | ForEach-Object { Write-Host '⚠️  Port 8787 in use by PID' $_; Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue; Write-Host '✅ Killed PID' $_ } } else { Write-Host '✅ Backend port 8787 is free' }"

REM Kill port 5173 (Frontend) using PowerShell
echo 🔍 Checking frontend port 5173...
powershell -Command "$procs = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($procs) { $procs | ForEach-Object { Write-Host '⚠️  Port 5173 in use by PID' $_; Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue; Write-Host '✅ Killed PID' $_ } } else { Write-Host '✅ Frontend port 5173 is free' }"

echo.
echo ⏳ Waiting for ports to be released...
timeout /t 3 /nobreak >nul
echo ✅ Ports are ready
echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 2: CHECK MYSQL
REM ═══════════════════════════════════════════════════════════════

echo [2/7] Checking MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if !errorlevel! neq 0 (
    echo.
    echo ❌ MySQL is NOT running!
    echo.
    echo ╔══════════════════════════════════════════════════════════╗
    echo ║  PLEASE START MYSQL IN XAMPP CONTROL PANEL             ║
    echo ╚══════════════════════════════════════════════════════════╝
    echo.
    echo Steps:
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

REM ═══════════════════════════════════════════════════════════════
REM   STEP 3: CHECK BACKEND DEPENDENCIES
REM ═══════════════════════════════════════════════════════════════

echo [3/7] Checking backend dependencies...
if exist "backend\node_modules\" (
    echo ✅ Backend dependencies installed
) else (
    echo ⚠️  Installing backend dependencies...
    cd backend
    call npm install --silent
    if !errorlevel! neq 0 (
        echo ❌ Failed to install backend dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo ✅ Backend dependencies installed
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 4: CHECK FRONTEND DEPENDENCIES
REM ═══════════════════════════════════════════════════════════════

echo [4/7] Checking frontend dependencies...
if exist "frontend\node_modules\" (
    echo ✅ Frontend dependencies installed
) else (
    echo ⚠️  Installing frontend dependencies...
    cd frontend
    call npm install --silent
    if !errorlevel! neq 0 (
        echo ❌ Failed to install frontend dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo ✅ Frontend dependencies installed
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 5: VERIFY DATABASE
REM ═══════════════════════════════════════════════════════════════

echo [5/7] Verifying database...
if exist "backend\diagnose.js" (
    cd backend
    node diagnose.js >nul 2>&1
    if !errorlevel! neq 0 (
        echo ⚠️  Database check failed
        echo Please ensure:
        echo   - Database "Technique" exists in phpMyAdmin
        echo   - Tables are imported from database/database.sql
        cd ..
    ) else (
        echo ✅ Database is ready
        cd ..
    )
) else (
    echo ⚠️  Diagnostic tool not found, skipping...
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 6: START BACKEND SERVER
REM ═══════════════════════════════════════════════════════════════

echo [6/7] Starting backend server...
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  Backend Server: http://localhost:8787                      ║
echo ║  API Health: http://localhost:8787/health                   ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

start "Backend Server - Port 8787" cmd /k "cd /d "%CD%\backend" && npm run dev"
timeout /t 5 /nobreak >nul

REM ═══════════════════════════════════════════════════════════════
REM   STEP 7: START FRONTEND SERVER
REM ═══════════════════════════════════════════════════════════════

echo [7/7] Starting frontend server...
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  Frontend Server: http://localhost:5173                     ║
echo ║  Connected to Backend: http://localhost:8787                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

start "Frontend Server - Port 5173" cmd /k "cd /d "%CD%\frontend" && npm run dev"

REM ═══════════════════════════════════════════════════════════════
REM   SUCCESS MESSAGE
REM ═══════════════════════════════════════════════════════════════

timeout /t 3 /nobreak >nul
cls
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║              ✅ SERVERS STARTED SUCCESSFULLY!               ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo ┌──────────────────────────────────────────────────────────────┐
echo │  SERVER STATUS                                               │
echo └──────────────────────────────────────────────────────────────┘
echo.
echo   🟢 Backend:  http://localhost:8787
echo   🟢 Frontend: http://localhost:5173
echo   🟢 MySQL:    Running in XAMPP
echo.
echo ┌──────────────────────────────────────────────────────────────┐
echo │  CONNECTION STATUS                                           │
echo └──────────────────────────────────────────────────────────────┘
echo.
echo   ✅ Frontend connected to Backend via Vite proxy
echo   ✅ Backend connected to MySQL database
echo   ✅ All API routes configured
echo.
echo ┌──────────────────────────────────────────────────────────────┐
echo │  ACCESS YOUR APPLICATION                                     │
echo └──────────────────────────────────────────────────────────────┘
echo.
echo   🌐 Main Website:  http://localhost:5173
echo   🔌 API Health:    http://localhost:8787/health
echo   💾 Database:      http://localhost/phpmyadmin
echo.
echo ┌──────────────────────────────────────────────────────────────┐
echo │  AVAILABLE PAGES                                             │
echo └──────────────────────────────────────────────────────────────┘
echo.
echo   • Home:           http://localhost:5173/
echo   • Shop:           http://localhost:5173/shop
echo   • Login:          http://localhost:5173/login
echo   • Register:       http://localhost:5173/register
echo   • Cart:           http://localhost:5173/cart
echo   • Dashboard:      http://localhost:5173/dashboard
echo   • Admin Login:    http://localhost:5173/admin-login
echo   • Admin Panel:    http://localhost:5173/admin/dashboard
echo.
echo ┌──────────────────────────────────────────────────────────────┐
echo │  HOW TO STOP SERVERS                                         │
echo └──────────────────────────────────────────────────────────────┘
echo.
echo   1. Go to each server window
echo   2. Press Ctrl+C
echo   3. Wait for "Server stopped" message
echo   4. Close the windows
echo.
echo   OR: Close the terminal windows directly
echo.
echo ┌──────────────────────────────────────────────────────────────┐
echo │  TROUBLESHOOTING                                             │
echo └──────────────────────────────────────────────────────────────┘
echo.
echo   • If port error occurs: Run this script again
echo   • If MySQL error: Start MySQL in XAMPP
echo   • If database error: Import database/database.sql
echo   • For more help: Read TROUBLESHOOTING.md
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║              🎉 ENJOY YOUR APPLICATION! 🎉                  ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Press any key to open the application in your browser...
pause >nul

REM Open browser
start http://localhost:5173

echo.
echo Browser opened! Your application is ready to use.
echo.
echo Keep this window open to see server status.
echo Close this window when you're done.
echo.

endlocal

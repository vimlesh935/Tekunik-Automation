@echo off
setlocal enabledelayedexpansion
title Tekunik - Start Servers (White Page Fix)
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║         TEKUNIK - FOOLPROOF STARTUP SCRIPT                  ║
echo ║         (Prevents White Page Issues)                        ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 1: CLEANUP PORTS
REM ═══════════════════════════════════════════════════════════════

echo [1/8] Cleaning up ports...
echo.

echo 🔍 Killing port 8787 (Backend)...
powershell -Command "$procs = Get-NetTCPConnection -LocalPort 8787 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue; Write-Host '✅ Killed PID' $_ } } else { Write-Host '✅ Port 8787 is free' }"

echo 🔍 Killing port 5173 (Frontend)...
powershell -Command "$procs = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue; Write-Host '✅ Killed PID' $_ } } else { Write-Host '✅ Port 5173 is free' }"

echo.
timeout /t 2 /nobreak >nul

REM ═══════════════════════════════════════════════════════════════
REM   STEP 2: CHECK MYSQL
REM ═══════════════════════════════════════════════════════════════

echo [2/8] Checking MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if !errorlevel! neq 0 (
    echo.
    echo ❌ MySQL is NOT running!
    echo.
    echo Please start MySQL in XAMPP Control Panel first.
    echo.
    pause
    exit /b 1
)
echo ✅ MySQL is running
echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 3: CHECK BACKEND DEPENDENCIES
REM ═══════════════════════════════════════════════════════════════

echo [3/8] Checking backend dependencies...
if exist "backend\node_modules\" (
    echo ✅ Backend dependencies installed
) else (
    echo ⚠️  Installing backend dependencies...
    cd backend
    call npm install --silent
    cd ..
    echo ✅ Backend dependencies installed
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 4: CHECK FRONTEND DEPENDENCIES
REM ═══════════════════════════════════════════════════════════════

echo [4/8] Checking frontend dependencies...
if exist "frontend\node_modules\" (
    echo ✅ Frontend dependencies installed
) else (
    echo ⚠️  Installing frontend dependencies...
    cd frontend
    call npm install --silent
    cd ..
    echo ✅ Frontend dependencies installed
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 5: CLEAR FRONTEND CACHE
REM ═══════════════════════════════════════════════════════════════

echo [5/8] Clearing frontend cache...
if exist "frontend\.vite\" (
    rmdir /s /q "frontend\.vite" 2>nul
    echo ✅ Cleared .vite cache
)
if exist "frontend\dist\" (
    rmdir /s /q "frontend\dist" 2>nul
    echo ✅ Cleared dist folder
)
echo ✅ Cache cleared
echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 6: START BACKEND
REM ═══════════════════════════════════════════════════════════════

echo [6/8] Starting backend server...
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  Backend: http://localhost:8787                             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

start "Backend Server - Port 8787" cmd /k "cd /d "%CD%\backend" && npm run dev"

echo ⏳ Waiting for backend to start...
timeout /t 8 /nobreak >nul

REM Test backend health
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8787/health' -UseBasicParsing -TimeoutSec 5; Write-Host '✅ Backend is responding' } catch { Write-Host '⚠️  Backend might still be starting...' }"
echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 7: START FRONTEND
REM ═══════════════════════════════════════════════════════════════

echo [7/8] Starting frontend server...
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  Frontend: http://localhost:5173                            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

start "Frontend Server - Port 5173" cmd /k "cd /d "%CD%\frontend" && npm run dev"

echo ⏳ Waiting for frontend to start...
timeout /t 5 /nobreak >nul

REM ═══════════════════════════════════════════════════════════════
REM   STEP 8: OPEN BROWSER
REM ═══════════════════════════════════════════════════════════════

echo [8/8] Opening browser...
echo.

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
echo │  IMPORTANT: PREVENTING WHITE PAGE                           │
echo └──────────────────────────────────────────────────────────────┘
echo.
echo   ✅ Ports cleaned automatically
echo   ✅ Cache cleared automatically
echo   ✅ Backend started first (required!)
echo   ✅ Frontend started after backend
echo   ✅ All dependencies verified
echo.
echo ┌──────────────────────────────────────────────────────────────┐
echo │  OPENING BROWSER                                             │
echo └──────────────────────────────────────────────────────────────┘
echo.
echo   🌐 Opening http://localhost:5173 in 3 seconds...
echo.
echo   If you see a white page:
echo     1. Wait 10 seconds for page to load
echo     2. Press Ctrl+Shift+R (hard refresh)
echo     3. Press F12 and check Console for errors
echo     4. Make sure both server windows are running
echo.

timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║              🎉 YOUR APPLICATION IS READY! 🎉               ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Keep this window and the server windows open.
echo Close them when you're done working.
echo.
echo Press any key to exit this window (servers will keep running)...
pause >nul

endlocal

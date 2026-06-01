@echo off
setlocal enabledelayedexpansion
title Tekunik Automation - Production Startup
color 0A
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║         TEKUNIK AUTOMATION - PRODUCTION STARTUP             ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check MySQL
echo [1/6] Checking MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if !errorlevel! neq 0 (
    echo ❌ MySQL is NOT running!
    echo.
    echo Please start MySQL in XAMPP Control Panel first.
    pause
    exit /b 1
)
echo ✅ MySQL is running
echo.

REM Clean ports
echo [2/6] Cleaning ports...
powershell -Command "$procs = Get-NetTCPConnection -LocalPort 8787 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"
powershell -Command "$procs = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"
timeout /t 2 /nobreak >nul
echo ✅ Ports cleaned
echo.

REM Check backend dependencies
echo [3/6] Checking backend dependencies...
if not exist "backend\node_modules\" (
    echo Installing backend dependencies...
    cd backend
    call npm install --silent
    cd ..
)
echo ✅ Backend ready
echo.

REM Check frontend dependencies
echo [4/6] Checking frontend dependencies...
if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install --silent
    cd ..
)
echo ✅ Frontend ready
echo.

REM Clear frontend cache
if exist "frontend\.vite\" rmdir /s /q "frontend\.vite" 2>nul
if exist "frontend\dist\" rmdir /s /q "frontend\dist" 2>nul

REM Start backend
echo [5/6] Starting backend server...
start "Tekunik Backend" cmd /k "title Tekunik Backend && color 0E && cd /d "%CD%\backend" && npm run dev"
timeout /t 5 /nobreak >nul
echo ✅ Backend starting...
echo.

REM Start frontend
echo [6/6] Starting frontend server...
start "Tekunik Frontend" cmd /k "title Tekunik Frontend && color 0B && cd /d "%CD%\frontend" && npm run dev"
timeout /t 5 /nobreak >nul
echo ✅ Frontend starting...
echo.

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
echo │  OPENING BROWSER                                             │
echo └──────────────────────────────────────────────────────────────┘
echo.

timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ✅ Application is ready!
echo.
echo Keep server windows open while using the application.
echo Press any key to exit this window...
pause >nul

endlocal

@echo off
title Fix White Page Issue
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║         TEKUNIK - WHITE PAGE FIX SCRIPT                     ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd frontend

echo [1/6] Stopping any running frontend servers...
echo.
powershell -Command "$procs = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"
timeout /t 2 /nobreak >nul
echo ✅ Port 5173 cleared
echo.

echo [2/6] Clearing node_modules and cache...
echo.
if exist "node_modules" (
    echo Removing node_modules...
    rmdir /s /q node_modules
)
if exist "dist" (
    echo Removing dist...
    rmdir /s /q dist
)
if exist ".vite" (
    echo Removing .vite cache...
    rmdir /s /q .vite
)
echo ✅ Cache cleared
echo.

echo [3/6] Installing dependencies...
echo.
call npm install
if %errorlevel% neq 0 (
    echo ❌ npm install failed
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

echo [4/6] Verifying critical files...
echo.
if not exist "src\main.jsx" (
    echo ❌ src\main.jsx is missing!
    pause
    exit /b 1
)
if not exist "src\index.css" (
    echo ❌ src\index.css is missing!
    pause
    exit /b 1
)
if not exist "index.html" (
    echo ❌ index.html is missing!
    pause
    exit /b 1
)
echo ✅ All critical files present
echo.

echo [5/6] Checking backend connection...
echo.
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8787/health' -UseBasicParsing -TimeoutSec 3; Write-Host '✅ Backend is running' } catch { Write-Host '⚠️  Backend is not running - Start it first!' }"
echo.

echo [6/6] Starting frontend server...
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║  Frontend will start in a new window                        ║
echo ║  URL: http://localhost:5173                                 ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Press any key to start the frontend server...
pause >nul

start "Frontend Server - Port 5173" cmd /k "npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║              ✅ FRONTEND SERVER STARTED!                    ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🌐 Opening browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo.
echo ┌──────────────────────────────────────────────────────────────┐
echo │  TROUBLESHOOTING                                             │
echo └──────────────────────────────────────────────────────────────┘
echo.
echo If you still see a white page:
echo.
echo 1. Open browser console (Press F12)
echo 2. Look for any red error messages
echo 3. Check the "Console" and "Network" tabs
echo 4. Make sure backend is running on port 8787
echo 5. Try hard refresh: Ctrl+Shift+R (or Ctrl+F5)
echo 6. Clear browser cache completely
echo.
echo Common Issues:
echo   • Backend not running → Start backend first
echo   • Browser cache → Clear cache and hard refresh
echo   • Port conflict → Run this script again
echo   • Missing dependencies → Already fixed by this script
echo.
pause

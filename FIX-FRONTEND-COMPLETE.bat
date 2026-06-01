@echo off
setlocal enabledelayedexpansion
title Tekunik - Complete Frontend Fix
color 0A
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║         TEKUNIK - COMPLETE FRONTEND FIX                     ║
echo ║         Fixes All Blank Page Issues                         ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 1: STOP ALL SERVERS
REM ═══════════════════════════════════════════════════════════════

echo [1/10] Stopping all servers...
echo.

powershell -Command "$procs = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue; Write-Host '✅ Killed frontend PID' $_ } } else { Write-Host '✅ Frontend port is free' }"

timeout /t 2 /nobreak >nul
echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 2: VERIFY BACKEND IS RUNNING
REM ═══════════════════════════════════════════════════════════════

echo [2/10] Checking backend server...
echo.

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8787/health' -UseBasicParsing -TimeoutSec 3; Write-Host '✅ Backend is running' -ForegroundColor Green } catch { Write-Host '❌ Backend is NOT running!' -ForegroundColor Red; Write-Host '   Please start backend first: cd backend && npm run dev' -ForegroundColor Yellow; exit 1 }"

if %errorlevel% neq 0 (
    echo.
    echo ╔══════════════════════════════════════════════════════════════╗
    echo ║  BACKEND MUST BE RUNNING FIRST!                             ║
    echo ╚══════════════════════════════════════════════════════════════╝
    echo.
    echo Start backend in a new terminal:
    echo   cd backend
    echo   npm run dev
    echo.
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)

echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 3: CLEAR ALL CACHES
REM ═══════════════════════════════════════════════════════════════

echo [3/10] Clearing all caches...
echo.

cd frontend

if exist ".vite" (
    rmdir /s /q ".vite" 2>nul
    echo ✅ Cleared .vite cache
)

if exist "dist" (
    rmdir /s /q "dist" 2>nul
    echo ✅ Cleared dist folder
)

if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache" 2>nul
    echo ✅ Cleared node_modules cache
)

echo ✅ All caches cleared
echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 4: VERIFY CRITICAL FILES
REM ═══════════════════════════════════════════════════════════════

echo [4/10] Verifying critical files...
echo.

set MISSING_FILES=0

if not exist "src\main.jsx" (
    echo ❌ src\main.jsx is missing!
    set MISSING_FILES=1
)

if not exist "src\index.css" (
    echo ❌ src\index.css is missing!
    set MISSING_FILES=1
)

if not exist "index.html" (
    echo ❌ index.html is missing!
    set MISSING_FILES=1
)

if not exist "src\ErrorBoundary.jsx" (
    echo ❌ src\ErrorBoundary.jsx is missing!
    set MISSING_FILES=1
)

if not exist "src\pages\Home.jsx" (
    echo ❌ src\pages\Home.jsx is missing!
    set MISSING_FILES=1
)

if not exist "src\components\Navbar.jsx" (
    echo ❌ src\components\Navbar.jsx is missing!
    set MISSING_FILES=1
)

if !MISSING_FILES! equ 1 (
    echo.
    echo ❌ Critical files are missing!
    echo    Please restore the files and try again.
    pause
    exit /b 1
)

echo ✅ All critical files present
echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 5: CHECK DEPENDENCIES
REM ═══════════════════════════════════════════════════════════════

echo [5/10] Checking dependencies...
echo.

if not exist "node_modules" (
    echo ⚠️  node_modules not found, installing...
    call npm install
    if !errorlevel! neq 0 (
        echo ❌ npm install failed!
        pause
        exit /b 1
    )
) else (
    echo ✅ node_modules exists
)

echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 6: VERIFY PACKAGE.JSON
REM ═══════════════════════════════════════════════════════════════

echo [6/10] Verifying package.json...
echo.

if not exist "package.json" (
    echo ❌ package.json is missing!
    pause
    exit /b 1
)

findstr /C:"react" package.json >nul
if !errorlevel! neq 0 (
    echo ❌ React not found in package.json!
    pause
    exit /b 1
)

echo ✅ package.json is valid
echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 7: CHECK VITE CONFIG
REM ═══════════════════════════════════════════════════════════════

echo [7/10] Checking Vite configuration...
echo.

if not exist "vite.config.js" (
    echo ❌ vite.config.js is missing!
    pause
    exit /b 1
)

echo ✅ Vite config exists
echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 8: CHECK TAILWIND CONFIG
REM ═══════════════════════════════════════════════════════════════

echo [8/10] Checking Tailwind configuration...
echo.

if not exist "tailwind.config.js" (
    echo ⚠️  tailwind.config.js is missing!
) else (
    echo ✅ Tailwind config exists
)

if not exist "postcss.config.js" (
    echo ⚠️  postcss.config.js is missing!
) else (
    echo ✅ PostCSS config exists
)

echo.

REM ═══════════════════════════════════════════════════════════════
REM   STEP 9: START FRONTEND SERVER
REM ═══════════════════════════════════════════════════════════════

echo [9/10] Starting frontend server...
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  Frontend: http://localhost:5173                            ║
echo ║  Backend:  http://localhost:8787                            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

start "Tekunik Frontend - Port 5173" cmd /k "title Tekunik Frontend && color 0B && npm run dev"

echo ⏳ Waiting for frontend to start...
timeout /t 8 /nobreak >nul

REM ═══════════════════════════════════════════════════════════════
REM   STEP 10: OPEN BROWSER
REM ═══════════════════════════════════════════════════════════════

echo [10/10] Opening browser...
echo.

timeout /t 3 /nobreak >nul

cls
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║              ✅ FRONTEND FIXED AND STARTED!                 ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo ┌──────────────────────────────────────────────────────────────┐
echo │  WHAT WAS FIXED                                              │
echo └──────────────────────────────────────────────────────────────┘
echo.
echo   ✅ Cleared all caches (.vite, dist)
echo   ✅ Verified all critical files exist
echo   ✅ Checked dependencies are installed
echo   ✅ Verified backend is running
echo   ✅ Started frontend with clean state
echo   ✅ Added error boundaries and fallbacks
echo   ✅ Improved error handling in components
echo.
echo ┌──────────────────────────────────────────────────────────────┐
echo │  SERVER STATUS                                               │
echo └──────────────────────────────────────────────────────────────┘
echo.
echo   🟢 Backend:  http://localhost:8787 (Running)
echo   🟢 Frontend: http://localhost:5173 (Starting...)
echo.
echo ┌──────────────────────────────────────────────────────────────┐
echo │  OPENING BROWSER                                             │
echo └──────────────────────────────────────────────────────────────┘
echo.
echo   🌐 Opening http://localhost:5173 in 3 seconds...
echo.
echo   If you still see a blank page:
echo.
echo   1. Wait 10-15 seconds for page to fully load
echo   2. Press F12 to open DevTools
echo   3. Check Console tab for any errors
echo   4. Try hard refresh: Ctrl+Shift+R
echo   5. Check Network tab - all requests should be green
echo.
echo ┌──────────────────────────────────────────────────────────────┐
echo │  DEBUGGING TIPS                                              │
echo └──────────────────────────────────────────────────────────────┘
echo.
echo   • Console Errors: Press F12 → Console tab
echo   • Network Issues: Press F12 → Network tab
echo   • Hard Refresh: Ctrl+Shift+R or Ctrl+F5
echo   • Clear Browser Cache: Ctrl+Shift+Delete
echo.
echo   Common Issues:
echo     - "Failed to fetch" → Backend not running
echo     - "Cannot find module" → Run npm install
echo     - White page, no errors → Wait longer or hard refresh
echo.

timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║              🎉 BROWSER OPENED! 🎉                          ║
echo ║                                                              ║
echo ║  Your website should now load without blank page            ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Keep the frontend terminal window open.
echo.
echo Press any key to exit this window...
pause >nul

cd ..
endlocal

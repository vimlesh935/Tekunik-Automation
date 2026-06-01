@echo off
title Fix and Restart Frontend
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║         FIXING FRONTEND ERROR - RESTARTING                  ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd frontend

echo [1/4] Stopping frontend server...
powershell -Command "$procs = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"
timeout /t 2 /nobreak >nul
echo ✅ Stopped
echo.

echo [2/4] Clearing cache...
if exist ".vite" rmdir /s /q ".vite" 2>nul
if exist "dist" rmdir /s /q "dist" 2>nul
echo ✅ Cache cleared
echo.

echo [3/4] Starting frontend server...
start "Tekunik Frontend" cmd /k "title Tekunik Frontend && color 0B && npm run dev"
echo ✅ Server starting...
echo.

echo [4/4] Opening browser in 8 seconds...
timeout /t 8 /nobreak >nul
start http://localhost:5173

cls
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║              ✅ FRONTEND RESTARTED!                         ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Your website should now load properly!
echo.
echo If you still see an error:
echo   1. Wait 10 seconds for the page to fully load
echo   2. Press Ctrl+Shift+R to hard refresh
echo   3. Check the frontend terminal for errors
echo   4. Make sure backend is running on port 8787
echo.
pause

cd ..

@echo off
echo.
echo ╔════════════════════════════════════════╗
echo ║   INSTALLING OPTIMIZED DEPENDENCIES  ║
echo ╚════════════════════════════════════════╝
echo.

cd backend

echo [1/3] Installing compression...
call npm install compression --save

echo.
echo [2/3] Installing helmet...
call npm install helmet --save

echo.
echo [3/3] Verifying installation...
call npm list compression helmet

echo.
echo ╔════════════════════════════════════════╗
echo ║  ✅ DEPENDENCIES INSTALLED!          ║
echo ╚════════════════════════════════════════╝
echo.
echo Your backend is now optimized!
echo.
echo To start the server:
echo   npm run dev
echo.
pause

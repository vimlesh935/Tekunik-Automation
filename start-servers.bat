@echo off
echo.
echo ╔════════════════════════════════════════╗
echo ║   TEKUNIK AUTOMATION - SAFE START    ║
echo ╚════════════════════════════════════════╝
echo.

REM Kill any process on port 8787
echo [1/5] Cleaning up port 8787...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8787 ^| findstr LISTENING') do (
    echo ⚠️  Killing process on port 8787 (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 2 /nobreak >nul
)
echo ✅ Port 8787 is clean
echo.

REM Kill any process on port 5173
echo [2/5] Cleaning up port 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    echo ⚠️  Killing process on port 5173 (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 2 /nobreak >nul
)
echo ✅ Port 5173 is clean
echo.

REM Check if XAMPP MySQL is running
echo [3/5] Checking XAMPP MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ MySQL is running
) else (
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
echo.

REM Check if backend dependencies are installed
echo [4/5] Checking backend dependencies...
if exist "backend\node_modules\" (
    echo ✅ Backend dependencies installed
) else (
    echo ⚠️  Backend dependencies not found
    echo Installing dependencies...
    cd backend
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
    cd ..
    echo ✅ Backend dependencies installed
)
echo.

REM Check if frontend dependencies are installed
echo [5/5] Checking frontend dependencies...
if exist "frontend\node_modules\" (
    echo ✅ Frontend dependencies installed
) else (
    echo ⚠️  Frontend dependencies not found
    echo Installing dependencies...
    cd frontend
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
    echo ✅ Frontend dependencies installed
)
echo.

echo ╔════════════════════════════════════════╗
echo ║  ✅ ALL CHECKS PASSED!               ║
echo ╚════════════════════════════════════════╝
echo.
echo Starting servers...
echo.
echo Backend will start on: http://localhost:8787
echo Frontend will start on: http://localhost:5173
echo.
echo Press Ctrl+C in each window to stop servers
echo.

REM Start both servers in separate windows
start "Backend Server - Port 8787" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend Server - Port 5173" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Servers started in separate windows
echo.
echo To stop servers:
echo - Close the terminal windows
echo - Or press Ctrl+C in each window
echo.
echo If port error occurs again:
echo - Run: backend\kill-port.bat
echo - Or restart this script
echo.
pause

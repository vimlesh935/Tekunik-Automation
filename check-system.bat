@echo off
title Tekunik - Quick Check
color 0A
echo.
echo ╔════════════════════════════════════════╗
echo ║     QUICK SYSTEM CHECK               ║
echo ╚════════════════════════════════════════╝
echo.

REM Check MySQL
echo Checking MySQL status...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ MySQL is RUNNING
) else (
    echo ❌ MySQL is NOT RUNNING
    echo.
    echo FIX: Open XAMPP Control Panel and start MySQL
    echo.
    goto :end
)
echo.

REM Check if backend folder exists
echo Checking backend folder...
if exist "backend\" (
    echo ✅ Backend folder exists
) else (
    echo ❌ Backend folder NOT FOUND
    goto :end
)
echo.

REM Check if node_modules exists
echo Checking dependencies...
if exist "backend\node_modules\" (
    echo ✅ Backend dependencies installed
) else (
    echo ❌ Backend dependencies NOT installed
    echo.
    echo FIX: Run this command:
    echo    cd backend
    echo    npm install
    echo.
    goto :end
)
echo.

REM Check .env file
echo Checking configuration...
if exist "backend\.env" (
    echo ✅ .env file exists
) else (
    echo ❌ .env file NOT FOUND
    echo.
    echo FIX: Create backend\.env file with database settings
    echo.
    goto :end
)
echo.

echo ╔════════════════════════════════════════╗
echo ║  ✅ BASIC CHECKS PASSED!             ║
echo ╚════════════════════════════════════════╝
echo.
echo Next steps:
echo 1. Make sure database 'Technique' exists in phpMyAdmin
echo 2. Import database/database.sql
echo 3. Run: start-servers.bat
echo.

:end
pause

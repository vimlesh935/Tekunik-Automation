@echo off
setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════╗
echo ║   FORCE KILL PORT 8787               ║
echo ╚════════════════════════════════════════╝
echo.

set PORT=8787
set KILLED=0

echo [1/2] Finding processes on port %PORT%...

REM Get all PIDs using port 8787
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
    set PID=%%a
    if not "!PID!"=="" (
        echo.
        echo Found process: PID !PID!
        echo Killing PID !PID!...
        taskkill /F /PID !PID! >nul 2>&1
        if !errorlevel! equ 0 (
            echo ✅ Killed PID !PID!
            set KILLED=1
        ) else (
            echo ⚠️  Could not kill PID !PID! ^(might need admin rights^)
        )
    )
)

if !KILLED! equ 0 (
    echo ✅ No processes found on port %PORT%
) else (
    echo.
    echo [2/2] Waiting for port to be released...
    timeout /t 3 /nobreak >nul
    echo ✅ Port %PORT% should now be free
)

echo.
echo ╔════════════════════════════════════════╗
echo ║  ✅ PORT CLEANUP COMPLETE            ║
echo ╚════════════════════════════════════════╝
echo.

REM Verify port is free
netstat -ano | findstr ":%PORT%" | findstr "LISTENING" >nul 2>&1
if !errorlevel! equ 0 (
    echo ⚠️  WARNING: Port %PORT% might still be in use
    echo Try running this script as Administrator
    echo.
) else (
    echo ✅ Verified: Port %PORT% is FREE
    echo.
)

endlocal

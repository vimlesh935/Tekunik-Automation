@echo off
echo.
echo ====================================
echo   PORT 8787 CLEANUP TOOL
echo ====================================
echo.

echo Checking port 8787...
powershell -Command "Get-NetTCPConnection -LocalPort 8787 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host 'Killing process' $_.OwningProcess; Stop-Process -Id $_.OwningProcess -Force }"

echo.
echo Waiting 2 seconds...
timeout /t 2 /nobreak > nul

echo.
echo ✅ Port 8787 is now free!
echo.
pause

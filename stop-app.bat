@echo off
title SecureVision AI - Stop
color 0C

echo.
echo  Stopping SecureVision AI...
echo.

:: Kill any running Flask/Python app.py processes
taskkill /F /FI "WINDOWTITLE eq SecureVision AI*" >nul 2>&1
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *app.py*" >nul 2>&1

:: Kill python processes running app.py specifically
for /f "tokens=2" %%i in ('wmic process where "commandline like '%%app.py%%'" get processid 2^>nul ^| findstr /r "[0-9]"') do (
    taskkill /F /PID %%i >nul 2>&1
)

echo  [OK] SecureVision AI stopped.
echo.
timeout /t 2 >nul

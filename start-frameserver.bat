@echo off
echo ========================================
echo FIXING CAMERA - STARTING FRAME SERVER
echo ========================================
echo.

echo This will start the Windows Camera Frame Server
echo which is REQUIRED for camera access.
echo.
echo Press any key to continue...
pause >nul

echo.
echo [1/3] Setting FrameServer to Automatic start...
sc config FrameServer start= demand
if %errorlevel% equ 0 (
    echo SUCCESS: FrameServer set to demand start
) else (
    echo WARNING: Could not configure FrameServer
)

echo.
echo [2/3] Starting FrameServer...
net start FrameServer
if %errorlevel% equ 0 (
    echo SUCCESS: FrameServer started!
) else (
    echo ERROR: Could not start FrameServer
    echo You may need to run this as Administrator
)

echo.
echo [3/3] Verifying service status...
sc query FrameServer

echo.
echo ========================================
echo DONE!
echo ========================================
echo.
echo Next steps:
echo 1. Try opening Windows Camera app
echo 2. If it works, close it and run: npm run dev
echo.
pause

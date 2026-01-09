@echo off
echo ========================================
echo Camera Access Fix Script
echo ========================================
echo.

echo [1/4] Starting Windows Camera Frame Server...
net start FrameServer
if %errorlevel% neq 0 (
    echo Warning: Could not start FrameServer. You may need administrator rights.
)
echo.

echo [2/4] Restarting Windows Camera Service...
net stop FrameServerMonitor
net start FrameServerMonitor
echo.

echo [3/4] Checking camera permissions...
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\webcam" /v Value
echo.

echo [4/4] Testing camera devices...
powershell -Command "Get-PnpDevice -Class 'Camera' | Select-Object Status, FriendlyName | Format-Table -AutoSize"
echo.

echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo If the issue persists:
echo 1. Go to Settings ^> Privacy ^> Camera
echo 2. Enable 'Allow apps to access your camera'
echo 3. Enable camera access for specific apps
echo 4. Restart your computer
echo.
pause

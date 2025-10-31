@echo off
echo ========================================
echo   CCTV Camera Integration Setup
echo ========================================
echo.

echo Step 1: Running database migration...
cd backend
py migrate_cameras.py

echo.
echo Step 2: Starting backend server...
echo.
echo Backend server will start on http://localhost:5000
echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To use CCTV cameras:
echo 1. Login to the system
echo 2. Go to "Cameras" page
echo 3. Click "Add Camera"
echo 4. Enter your camera's RTSP URL
echo 5. Test the connection
echo.
echo RTSP URL Format:
echo rtsp://username:password@ip:port/path
echo.
echo Example:
echo rtsp://admin:password123@192.168.1.100:554/stream
echo.
echo ========================================
echo.

py app.py

pause

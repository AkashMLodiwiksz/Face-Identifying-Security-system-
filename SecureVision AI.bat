@echo off
title SecureVision AI
color 0A

:: Get script directory
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

:: Check if frontend is built
if not exist "frontend-react\dist\index.html" (
    echo.
    echo  [!] Frontend not built yet. Running build first...
    echo.
    call build.bat
)

:: Set production mode
set SERVE_FRONTEND=1
set FLASK_ENV=production

:: Start the server
echo.
echo  ============================================
echo    SecureVision AI - Starting...
echo  ============================================
echo.
echo  The app will open in your browser automatically.
echo  Keep this window open while using the app.
echo  Press Ctrl+C to stop the server.
echo.

cd backend
python app.py

@echo off
title SecureVision AI - Build System
color 0B

echo.
echo  ============================================
echo    SecureVision AI - Production Build
echo  ============================================
echo.

:: Get script directory
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

:: Step 1: Check Python
echo  [1/4] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Install Python 3.10+ from python.org
    pause
    exit /b 1
)
echo  [OK] Python found

:: Step 2: Check Node.js
echo  [2/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found. Install from nodejs.org
    pause
    exit /b 1
)
echo  [OK] Node.js found

:: Step 3: Install dependencies
echo  [3/4] Installing dependencies...
echo     Installing Python packages...
cd backend
python -m pip install -r requirements.txt --quiet 2>nul
cd ..

echo     Installing Node packages...
cd frontend-react
call npm install --silent 2>nul
cd ..
echo  [OK] Dependencies installed

:: Step 4: Build React frontend
echo  [4/4] Building React frontend for production...
cd frontend-react
call npm run build
cd ..

if not exist "frontend-react\dist\index.html" (
    echo  [ERROR] Build failed! frontend-react\dist\index.html not found
    pause
    exit /b 1
)

echo.
echo  ============================================
echo    BUILD COMPLETE!
echo  ============================================
echo.
echo  To run SecureVision AI:
echo    Double-click "SecureVision AI.bat"
echo    OR run: cd backend ^&^& python app.py
echo.
echo  To create a desktop shortcut:
echo    Run "create-shortcut.bat"
echo.
pause

@echo off
echo Starting Face Recognition Security System...
echo.

REM Set PATH to include Node.js and Python
set PATH=C:\Program Files\nodejs;%PATH%
set PATH=C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python312;%PATH%
set PATH=C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python312\Scripts;%PATH%

REM Navigate to project directory
cd /d "%~dp0"

echo Starting backend server...
start "Flask Backend" cmd /k "cd backend && python app.py"

timeout /t 3 >nul

echo Starting frontend server...
cd frontend-react
npm run dev

pause

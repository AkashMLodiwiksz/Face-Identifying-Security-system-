@echo off
echo Starting Face Recognition Security System...
echo.

REM Kill any existing processes
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM py.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1

echo Cleaned up old processes
echo.
echo Starting Backend (Flask) in new window...
start "Flask Backend" cmd /k "cd backend && py app.py"

timeout /t 3 >nul

echo Starting Frontend (React) in new window...
start "React Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173 or 5174
echo ========================================
echo.
echo Press any key to stop all servers...
pause >nul

REM Clean up when user presses a key
echo.
echo Stopping all servers...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM py.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo Done!

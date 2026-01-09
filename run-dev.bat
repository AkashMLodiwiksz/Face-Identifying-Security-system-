@echo off
SET PATH=C:\Program Files\nodejs;%PATH%

echo Starting Flask Backend...
start "Flask Backend" cmd /k "cd backend && py app.py"

timeout /t 3 >nul

echo Starting React Frontend...
cd frontend-react
call npm run dev

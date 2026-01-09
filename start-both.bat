@echo off
SET PATH=C:\Program Files\nodejs;%PATH%

echo [1/2] Starting Flask Backend...
start "Flask Backend" cmd /k "cd backend && py app.py"

timeout /t 2 >nul

echo [2/2] Starting React Frontend...
cd frontend-react
npm run dev

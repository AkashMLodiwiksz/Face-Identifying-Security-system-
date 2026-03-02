@echo off
echo ======================================
echo SQLite Database Viewer
echo ======================================
echo.

cd /d "%~dp0"

if "%1"=="" (
    echo Viewing all tables...
    python view_database.py
) else if "%1"=="--list" (
    echo Listing all tables...
    python view_database.py --list
) else if "%1"=="--table" (
    echo Viewing table: %2
    python view_database.py --table %2
) else (
    echo Usage:
    echo   view_db.bat              - View all tables with sample data
    echo   view_db.bat --list       - List all tables with row counts
    echo   view_db.bat --table NAME - View specific table
)

echo.
pause

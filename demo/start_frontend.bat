@echo off
title Business Logic Agent - Frontend
cd /d "%~dp0..\frontend"

echo ========================================
echo   Business Logic Agent - Frontend
echo ========================================
echo.
echo Checking node_modules...
if not exist "node_modules" (
    echo [ERROR] node_modules not found. Run: npm install
    pause
    exit /b 1
)
echo Checking npm...
call npm --version 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm not found in PATH!
    pause
    exit /b 1
)
echo.
echo Starting Vite dev server on port 5173...
echo Frontend : http://localhost:5173
echo.
call npm run dev
pause
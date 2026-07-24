@echo off
title Business Logic Agent - Launcher
echo ========================================
echo   Business Logic Agent - Start All
echo ========================================
echo.
echo [1/2] Starting Backend on port 8000...
start "IPD-Backend" cmd /k %~dp0start_backend.bat
echo [2/2] Starting Frontend on port 5173...
start "IPD-Frontend" cmd /k %~dp0start_frontend.bat
echo.
echo ========================================
echo   Services starting!
echo   Backend  : http://localhost:8000
echo   Frontend : http://localhost:5173
echo   API Docs : http://localhost:8000/docs
echo ========================================
echo.
pause
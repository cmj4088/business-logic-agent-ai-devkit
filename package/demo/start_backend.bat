@echo off
title Business Logic Agent - Backend
cd /d "%~dp0..\backend"

echo ========================================
echo   Business Logic Agent - Backend
echo ========================================
echo.
echo Checking Python...
python --version 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found in PATH!
    pause
    exit /b 1
)
echo Checking uvicorn...
python -c "import uvicorn" 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] uvicorn not installed. Run: pip install uvicorn
    pause
    exit /b 1
)
echo Checking config.yaml...
if not exist "config.yaml" (
    echo [ERROR] config.yaml not found in backend directory!
    echo Please create config.yaml with jwt_secret and fernet_key.
    pause
    exit /b 1
)
echo.
set "PYTHONPATH=%~dp0..\backend;%~dp0.."
echo Starting FastAPI on port 8000...
echo Backend  : http://localhost:8000
echo API Docs : http://localhost:8000/docs
echo.
python -m uvicorn m0_infrastructure.main:app --host 0.0.0.0 --port 8000 --reload
pause
@echo off
chcp 65001 >nul
title BLA Server Launcher

cd /d "%~dp0"
python server_launcher.py

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start. Make sure Python 3.10+ is installed.
    echo         Download: https://www.python.org/downloads/
    echo.
    pause
)

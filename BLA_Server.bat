@echo off
chcp 65001 >nul
title Business Logic Agent Server

:: ============================================================================
:: Business Logic Agent — 局域网服务器启动脚本
::
:: 功能：调用 Python 启动器，自动检测 IP、安装依赖、构建前端、启动服务
:: ============================================================================

cd /d "%~dp0"
python server_launcher.py

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start. Make sure Python 3.10+ is installed.
    echo         Download: https://www.python.org/downloads/
    echo.
    pause
)

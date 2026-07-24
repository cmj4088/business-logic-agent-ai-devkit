@echo off
chcp 65001 >nul
title BLA Installer Builder

set "PROJECT_DIR=%~dp0"
set "ELECTRON_DIR=%PROJECT_DIR%electron"
set "FRONTEND_DIR=%PROJECT_DIR%frontend"

if "%1"=="" (
    echo.
    echo [ERROR] Please specify server IP address!
    echo   Usage: build-exe.bat ^<SERVER_IP^>
    echo   Example: build-exe.bat 192.168.1.100
    pause
    exit /b 1
)

set "INPUT=%1"
:: 检查是否传入了完整 URL（如 https://xxx.trycloudflare.com）
echo %INPUT% | findstr /i "http" >nul 2>&1
if %errorlevel% equ 0 (
    set "SERVER_URL=%INPUT%"
) else (
    set "SERVER_URL=http://%INPUT%:8000"
)
set "OUTPUT_FILE=BLA_Judge_Client_Setup.exe"

cls
echo =======================================
echo   BLA Judge Client - Build Tool
echo   Server: %SERVER_URL%
echo =======================================
echo.

:: Step 1: Check Node.js
echo [1/4] Checking build environment...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   [FAIL] npm not found! Install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
for /f "delims=" %%i in ('npm --version 2^>^&1') do echo   [OK] npm %%i
echo.

:: Step 2: Build frontend
echo [2/4] Building frontend...
cd /d "%FRONTEND_DIR%"
if not exist "node_modules\" ( call npm install --silent )
call npm run build >nul 2>&1
if %errorlevel% neq 0 (
    echo   [FAIL] Frontend build failed!
    pause
    exit /b 1
)
echo   [OK] Frontend built
echo.

:: Step 3: Configure + compile Electron
echo [3/4] Configuring Electron client...
cd /d "%ELECTRON_DIR%"
python -c "import json; json.dump({'serverUrl': '%SERVER_URL%'}, open('app-config.json','w'))"
echo   [OK] Server config written: %SERVER_URL%
if not exist "node_modules\" ( call npm install --silent )
call npx tsc >nul 2>&1
if %errorlevel% neq 0 (
    echo   [FAIL] TypeScript compilation failed!
    del app-config.json 2>nul
    pause
    exit /b 1
)
echo   [OK] TypeScript compiled
echo.

:: Step 4: Package (use Chinese mirror for Electron download)
echo [4/4] Packaging Windows installer...
echo   (This may take 2-3 minutes on first run)
set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
call npx electron-builder --win --config >nul 2>&1
if %errorlevel% neq 0 (
    echo   [FAIL] Packaging failed!
    echo   Run without ^>nul to see error details
    del app-config.json 2>nul
    pause
    exit /b 1
)

del app-config.json 2>nul

:: Copy to project root
echo   Copying installer to project root...
for /f "delims=" %%i in ('dir /b /s "%ELECTRON_DIR%\dist-electron\*.exe" 2^>nul') do (
    copy /y "%%i" "%PROJECT_DIR%%OUTPUT_FILE%" >nul
    goto :BUILD_DONE
)
:BUILD_DONE

echo.
echo   [OK] Installer built successfully!
echo.
echo =======================================
echo   Output: %PROJECT_DIR%%OUTPUT_FILE%
echo.
echo   Usage:
echo   1. Send "%OUTPUT_FILE%" to judges
echo   2. Judges double-click to install
echo   3. Desktop shortcut "BLA" opens app
echo   4. Auto-connects to your server
echo.
echo   Server: %SERVER_URL%
echo.
echo   First start your server:
echo     Double-click "启动服务器.bat"
echo.
echo =======================================
echo.
pause

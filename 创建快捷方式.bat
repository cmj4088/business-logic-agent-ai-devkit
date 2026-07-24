@echo off
chcp 65001 >nul
title Create Desktop Shortcut

set "PROJECT_DIR=%~dp0"

if not exist "%PROJECT_DIR%启动服务器.bat" (
    if exist "%PROJECT_DIR%BLA_Server.bat" (
        set "TARGET_BAT=BLA_Server.bat"
    ) else (
        echo [ERROR] BLA_Server.bat not found!
        pause
        exit /b 1
    )
) else (
    set "TARGET_BAT=启动服务器.bat"
)

powershell -Command ^
    $WS = New-Object -ComObject WScript.Shell; ^
    $SC = $WS.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\BLA Server.lnk'); ^
    $SC.TargetPath = '%PROJECT_DIR%%TARGET_BAT%'; ^
    $SC.WorkingDirectory = '%PROJECT_DIR%'; ^
    $SC.Description = 'BLA Server - One click to start'; ^
    $SC.IconLocation = '%%SystemRoot%%\\System32\\imageres.dll,179'; ^
    $SC.WindowStyle = 3; ^
    $SC.Save();

if %errorlevel% equ 0 (
    echo [OK] Shortcut created on desktop: BLA Server.lnk
    echo.
    echo Double-click it to start the server.
    echo Judges visit: http://YOUR_IP:8000
) else (
    echo [FAIL] Shortcut creation failed.
    echo Create a manual shortcut pointing to: %TARGET_BAT%
)

echo.
pause

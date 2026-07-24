@echo off
chcp 65001 >nul
title Clash Meta 内核更新工具

echo ========================================
echo   Clash Meta (Mihomo) 内核更新
echo ========================================
echo.

:: 需要管理员权限才能写入 Program Files
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] 需要管理员权限！
    echo     请右键 → "以管理员身份运行"
    pause
    exit /b 1
)

set "CLASH_DIR=C:\Program Files\Clash Verge"
set "BACKUP_DIR=%USERPROFILE%\Desktop\clash-kernel-backup"

echo [1/4] 获取最新版本号...
:: 用 GitHub API 获取最新版本
for /f "tokens=2 delims= " %%a in ('curl -s https://api.github.com/repos/MetaCubeX/mihomo/releases/latest ^| find "tag_name"') do (
    set "LATEST=%%a"
    goto :got_version
)
:got_version
set "LATEST=%LATEST:"=%"
set "LATEST=%LATEST:,=%"

if "%LATEST%"=="" (
    echo [!] 获取版本失败，使用默认版本 v1.19.27
    set "LATEST=v1.19.27"
)
echo    最新版本: %LATEST%

:: 拼接下载地址
set "VERSION=%LATEST:v=%"
set "DOWNLOAD_URL=https://github.com/MetaCubeX/mihomo/releases/download/%LATEST%/mihomo-windows-amd64-%VERSION%.zip"

echo [2/4] 下载最新内核...
echo    下载地址: %DOWNLOAD_URL%
echo.

:: 下载到临时目录
set "TEMP_DIR=%TEMP%\mihomo_update"
mkdir "%TEMP_DIR%" 2>nul
del /f /q "%TEMP_DIR%\*.*" 2>nul

curl -L --progress-bar -o "%TEMP_DIR%\mihomo.zip" "%DOWNLOAD_URL%"
if %errorLevel% neq 0 (
    echo [!] 下载失败！请检查网络连接
    pause
    exit /b 1
)
echo    下载完成！

echo [3/4] 备份旧内核...
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
copy "%CLASH_DIR%\verge-mihomo.exe" "%BACKUP_DIR%\verge-mihomo.exe.backup" >nul
echo    旧内核已备份到: %BACKUP_DIR%

echo [4/4] 安装新内核...
:: 解压
powershell -Command "Expand-Archive -Path '%TEMP_DIR%\mihomo.zip' -DestinationPath '%TEMP_DIR%\mihomo' -Force" >nul

:: 找解压后的 exe
for /r "%TEMP_DIR%\mihomo" %%f in (*.exe) do (
    echo    找到: %%f
    :: 停止 Clash Verge
    taskkill /f /im clash-verge.exe 2>nul
    timeout /t 2 /nobreak >nul

    :: 替换内核
    copy /y "%%f" "%CLASH_DIR%\verge-mihomo.exe" >nul
    echo    ✓ 内核已更新！
    goto :done
)

:done
:: 清理临时文件
del /f /q "%TEMP_DIR%\mihomo.zip" 2>nul
rmdir /s /q "%TEMP_DIR%\mihomo" 2>nul

echo.
echo ========================================
echo   更新完成！
echo ========================================
echo.
echo  新版本: %LATEST%
echo  位置: %CLASH_DIR%\verge-mihomo.exe
echo.
echo  备份文件: %BACKUP_DIR%\verge-mihomo.exe.backup
echo  如需恢复，请手动复制备份文件替换
echo.
echo  按任意键启动 Clash Verge...
pause >nul

:: 启动 Clash Verge
start "" "%CLASH_DIR%\clash-verge.exe"

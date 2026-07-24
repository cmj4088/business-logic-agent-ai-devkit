@echo off
chcp 65001 >nul
title BLA U盘部署准备工具

:: =============================================================================
:: Business Logic Agent — U盘部署准备脚本（Windows 端）
:: 功能：清空U盘 → 复制项目必要文件到U盘
::
:: 使用方法：
::   1. 插入U盘
::   2. 双击运行本脚本（本脚本必须在项目根目录）
::   3. 按提示输入U盘盘符
::   4. 将U盘插入 Linux 机器后运行: sudo bash deploy.sh
:: =============================================================================

set "PROJECT_DIR=%~dp0"

echo ════════════════════════════════════════════════════════════════
echo   Business Logic Agent — U盘部署准备工具
echo   本脚本将清空目标U盘并复制项目文件
echo ════════════════════════════════════════════════════════════════
echo.
echo [📁] 项目目录: %PROJECT_DIR%

:: ---- 前置检查 ----
if not exist "%PROJECT_DIR%backend\" (
    echo [❌] 错误：未找到 backend 目录！
    echo     请将本脚本放在项目根目录下运行。
    pause
    exit /b 1
)
if not exist "%PROJECT_DIR%docker-compose.yml" (
    echo [❌] 错误：未找到 docker-compose.yml！
    pause
    exit /b 1
)

:: ---- 选择U盘盘符 ----
echo.
echo [💾] 可移动磁盘列表（通常为U盘）:
wmic logicaldisk where drivetype=2 get deviceid, volumename, size 2>nul
echo.
set /p USB_DRIVE="请输入U盘盘符（如 E:）: "

if "%USB_DRIVE%"=="" (
    echo [❌] 盘符不能为空！
    pause
    exit /b 1
)

set "USB_ROOT=%USB_DRIVE:~0,1%:\"
if not exist "%USB_ROOT%" (
    echo [❌] 错误：盘符 %USB_ROOT% 不存在！
    pause
    exit /b 1
)

:: ---- 确认清空 ----
echo.
echo ⚠️  警告：%USB_ROOT% 上的所有文件将被删除！
set /p CONFIRM="输入 YES 确认清空并继续: "
if /i not "%CONFIRM%"=="YES" (
    echo [❌] 已取消。
    pause
    exit /b 1
)

:: ---- 清空U盘 ----
echo.
echo [🧹] 正在清空U盘 ...
cd /d "%USB_ROOT%"
for /f "delims=" %%i in ('dir /a-d /b "%USB_ROOT%" 2^>nul') do (
    attrib -r -h -s "%USB_ROOT%%%i" 2>nul
    del /f /q "%USB_ROOT%%%i" 2>nul
)
for /f "delims=" %%d in ('dir /ad /b "%USB_ROOT%" 2^>nul') do (
    attrib -r -h -s "%USB_ROOT%%%d" /s /d 2>nul
    rd /s /q "%USB_ROOT%%%d" 2>nul
)
echo [✅] U盘已清空。

:: ---- 复制项目文件 ----
cd /d "%PROJECT_DIR%"
echo.
echo [📋] 正在复制项目文件到U盘 ...

xcopy "backend" "%USB_ROOT%backend\" /e /i /h /q /y >nul
if %errorlevel% neq 0 (
    echo [⚠] backend 复制可能不完整
) else (
    echo   ✅ backend/ — 后端代码
)

if exist "shared\" (
    xcopy "shared" "%USB_ROOT%shared\" /e /i /h /q /y >nul
    echo   ✅ shared/ — 共享代码
)

copy /y "docker-compose.yml" "%USB_ROOT%docker-compose.yml" >nul
echo   ✅ docker-compose.yml

if not exist "%USB_ROOT%docker\" mkdir "%USB_ROOT%docker\" >nul
copy /y "docker\Dockerfile.backend" "%USB_ROOT%docker\Dockerfile.backend" >nul
echo   ✅ docker/Dockerfile.backend

if exist ".dockerignore" (
    copy /y ".dockerignore" "%USB_ROOT%.dockerignore" >nul
    echo   ✅ .dockerignore
)

:: ---- 复制 Linux 部署脚本 ----
copy /y "deploy.sh" "%USB_ROOT%deploy.sh" >nul
if %errorlevel% equ 0 (
    echo   ✅ deploy.sh — Linux 部署脚本
) else (
    echo [❌] deploy.sh 复制失败！
    pause
    exit /b 1
)

:: ---- 完成 ----
echo.
echo ════════════════════════════════════════════════════════════════
echo   ✅ 部署准备完成！
echo.
echo   U盘路径：%USB_ROOT%
echo.
echo   ▶  在 Linux 上使用方法:
echo      sudo bash %USB_DRIVE%\deploy.sh
echo.
echo      # 自定义端口:
echo      sudo bash %USB_DRIVE%\deploy.sh 8080
echo.
echo   ⚠  注意：
echo     - 首次运行需联网安装 Docker（后续离线可用）
echo     - 脚本会自动安装 Docker（仅限 Ubuntu/Debian/CentOS）
echo     - 如果 Ollama 在宿主机上，Docker 容器可通过
echo       http://host.docker.internal:11434 访问
echo.
echo   📂 U盘文件清单:
dir /b "%USB_ROOT%"
echo ════════════════════════════════════════════════════════════════
pause

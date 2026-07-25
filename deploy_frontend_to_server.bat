@echo off
chcp 65001 >nul
title BLA - 部署前端到服务器

set "PROJECT_DIR=%~dp0"
set "FRONTEND_DIST=%PROJECT_DIR%frontend\dist"
set "SERVER=root@121.199.31.157"

cls
echo ============================================
echo   BLA - 部署前端到云服务器
echo   服务器: %SERVER%
echo ============================================
echo.

:: 检查 dist 目录
if not exist "%FRONTEND_DIST%\index.html" (
    echo [错误] 未找到前端构建文件!
    echo   请先在 frontend 目录运行: npm run build
    pause
    exit /b 1
)
echo [1/3] 本地前端文件已就绪
dir /b "%FRONTEND_DIST%"
echo.

:: SCP 上传 dist 目录到服务器
echo [2/3] 正在上传前端文件到服务器...
echo   目标: /root/bla/frontend/dist/
echo.
echo   请输入服务器密码（输入时不会显示）:
echo.

:: 先在服务器上创建目录
ssh %SERVER% "mkdir -p /root/bla/frontend/dist"

:: 上传整个 dist 目录
scp -r "%FRONTEND_DIST%\*" %SERVER%:/root/bla/frontend/dist/

if %errorlevel% neq 0 (
    echo.
    echo [错误] 上传失败! 请检查密码和网络连接。
    pause
    exit /b 1
)
echo   上传完成!
echo.

:: 重启服务器
echo [3/3] 正在重启后端服务...
echo.
ssh %SERVER% "cd /root/bla && ls backend/m0_infrastructure/main.py && pkill -f 'uvicorn' 2>/dev/null; nohup python -m m0_infrastructure.main > /root/bla/server.log 2>&1 &"

if %errorlevel% neq 0 (
    echo [警告] 重启命令执行结果请确认
) else (
    echo   后端服务已重启!
)

echo.
echo ============================================
echo  部署完成!
echo   请等待 10 秒后访问验证:
echo   http://121.199.31.157:8000/
echo ============================================
pause

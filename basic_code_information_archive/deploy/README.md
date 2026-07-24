# U盘离线部署工具 代码说明

## 概述
提供两个脚本实现 Windows → USB → Linux 的离线 Docker 部署流程，无需 GitHub 连接。

---

## 文件: prepare_usb.bat
- **路径**: `prepare_usb.bat`
- **作用**: Windows 端 U盘准备脚本。清空U盘，将项目后端部署所需文件复制到U盘根目录
- **关键函数/命令**:
  - `wmic logicaldisk where drivetype=2` : 列举可移动磁盘供用户选择
  - `for /f "delims=" %%i in ('dir ...')` : 递归清空U盘所有文件和目录
  - `xcopy "backend" ... /e /i /h /q /y` : 安静模式复制后端全部代码
- **依赖关系**:
  - 前置: 项目根目录必须存在 `backend/`、`docker-compose.yml`
  - 被引用: 用户直接双击运行
- **最后修改**: 2026-07-23
- **修改原因**: 新建文件，用于生成可引导的 U盘部署工具

## 文件: deploy.sh
- **路径**: `deploy.sh`
- **作用**: Linux 端 Docker 部署脚本。从U盘本地源码构建 image → 启动容器 → 暴露 API
- **关键函数/逻辑**:
  - `Docker自动安装` : 检测发行版（Ubuntu/Debian/CentOS/RHEL/Fedora），自动安装 docker-ce + docker-compose-plugin
  - `docker compose build backend` : 从 U盘本地 `docker-compose.yml` + `Dockerfile.backend` 构建镜像
  - `docker compose up -d backend` : 后台启动容器，映射 `BACKEND_PORT`（默认 8000）
  - `连通性检测` : 启动后自动 `curl` 测试 `/docs` 端点是否可达
- **依赖关系**:
  - 前置: docker-compose.yml、docker/Dockerfile.backend、backend/、shared/ 必须在同目录
  - 环境: Linux（bash），需要 sudo/root 权限
- **最后修改**: 2026-07-23
- **修改原因**: 新建文件

---

## U盘文件清单
U盘根目录应包含以下文件（由 prepare_usb.bat 自动生成）:

```
deploy.sh              ← Linux 部署脚本（入口）
docker-compose.yml     ← Compose 编排
.dockerignore          ← Docker 构建排除规则
docker/
  └── Dockerfile.backend  ← 后端 Dockerfile
backend/               ← 后端全部 Python 代码
  ├── requirements.txt
  ├── config.yaml
  ├── m0_infrastructure/
  ├── m1_auth_security/
  ├── m2_workflow_engine/
  ├── m3_prompt_system/
  ├── m4_agent_orchestration/
  ├── m5_artifact_management/
  ├── m6_review_system/
  ├── m7_plugin_system/
  ├── m8_realtime_communication/
  ├── m9_usage_tracking/
  └── m10_recovery/
shared/                ← 前后端共享代码
  ├── types.py
  ├── constants.py
  ├── errors.py
  ├── validators.py
  └── data_filter.py
```

---

## 使用流程
```
Windows:              USB:                    Linux:
  prepare_usb.bat  →  deploy.sh          →  sudo bash deploy.sh
  ① 插入U盘          ① 插入U盘               ① 检查/安装 Docker
  ② 运行脚本          ② 无操作                ② 构建 Docker 镜像
  ③ 输入盘符                                 ③ 启动后端容器
  ④ 自动清空+复制                            ④ API http://localhost:8000
```

## 后端端口
- 默认端口: **8000**
- 自定义: `sudo bash deploy.sh 8080`
- 容器内 Uvicorn 监听 `0.0.0.0:8000`，映射到宿主机指定端口
- API 文档: `http://localhost:<PORT>/docs`

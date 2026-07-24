# Business Logic Agent (BLA)

基于 AI Agent 的商业逻辑工作流引擎。内置 IPD（集成产品开发）模板，支持自定义阶段、门禁、角色和活动。

## 目录结构

```
package/
├── src/                          # 源代码
│   ├── backend/                  # Python FastAPI 后端
│   ├── frontend/                 # React + TypeScript 前端
│   ├── electron/                 # Electron 桌面壳
│   └── shared/                   # 前后端共享类型/常量
├── packages/
│   ├── frontend/                 # 前端安装包
│   │   └── BLA_Judge_Client_Setup.exe   # Windows 桌面客户端
│   └── backend/                  # 后端部署包
│       ├── docker-compose.yml    # Docker 编排
│       ├── Dockerfile.backend    # 后端镜像
│       ├── Dockerfile.frontend   # 前端镜像
│       ├── nginx.conf            # Nginx 配置
│       └── deploy.sh             # Linux 部署脚本
├── scripts/                      # 快捷启动脚本
│   ├── BLA_Server.bat            # 启动服务器
│   ├── server_launcher.py        # Python 启动器（含公网隧道）
│   └── build-exe.bat             # 构建 Windows 安装包
├── demo/                         # 测试启动脚本
└── README.md
```

## 快速开始

### 方式一：源码运行（开发）

**后端：**
```bash
cd src/backend
pip install -r requirements.txt
python -m uvicorn m0_infrastructure.main:app --host 0.0.0.0 --port 8000
```

**前端：**
```bash
cd src/frontend
npm install
npm run dev
```
浏览器打开 http://localhost:5173

### 方式二：Docker 部署（生产）

```bash
cd packages/backend
docker compose up -d
```
浏览器打开 http://localhost:8000

### 方式三：Windows 一键启动

```bash
scripts/BLA_Server.bat
```

### 方式四：评委客户端

```bash
scripts/build-exe.bat <服务器IP>
```
生成 `packages/frontend/BLA_Judge_Client_Setup.exe`，发给评委安装即可。

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面壳 | Electron 28+ |
| 前端 | React 18 + TypeScript + Ant Design 5.x |
| 后端 | Python 3.11+ / FastAPI |
| 数据库 | SQLite + aiosqlite |
| 本地 LLM | Ollama |
| 云端 LLM | Anthropic / OpenAI / DeepSeek |

## 协议

MIT License

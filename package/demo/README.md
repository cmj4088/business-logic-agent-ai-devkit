# Demo — Business Logic Agent 快捷启动

## 测试目的
提供一键启动脚本和独立测试程序，方便开发者快速拉起 Business Logic Agent 前后端服务进行端到端验证，无需手动进入各自目录执行命令。

## 环境前置要求
- **Python 3.11+**：已在 PATH 中，且已安装 uvicorn（`pip install uvicorn`）
- **Node.js 18+**：已在 PATH 中，且 `frontend/node_modules` 已安装（`cd frontend && npm install`）
- **config.yaml**：`backend/config.yaml` 必须存在，含 `jwt_secret` 和 `fernet_key`（缺失时 start_backend.bat 会报错退出）

## 目录结构

```
demo/
├── README.md                    # 本文件 — 总览说明
├── start_all.bat                # 一键启动前后端
├── start_backend.bat            # 仅启动后端
├── start_frontend.bat           # 仅启动前端
├── check-api/                   # API 基础连接检查
├── verify-api/                  # API 端到端验证
├── check-project/               # 项目状态检查
├── advance-project/             # 推进项目阶段
├── seed-data/                   # 种子数据插入
└── test-plugins/                # 插件系统测试
```

### 启动脚本

| 脚本 | 作用 | 端口 |
|------|------|------|
| `start_all.bat` | 同时启动前后端（依次调用 start_backend + start_frontend） | 8000 + 5173 |
| `start_backend.bat` | 仅启动后端 FastAPI 服务（uvicorn + reload） | 8000 |
| `start_frontend.bat` | 仅启动前端 Vite 开发服务器 | 5173 |

### 测试程序（独立子目录）

| 目录 | 测试内容 | 运行命令 |
|------|---------|---------|
| `check-api/` | API 基础连接检查 | `python demo/check-api/check_api.py` |
| `verify-api/` | API 端到端验证 | `python demo/verify-api/verify_api.py` |
| `check-project/` | 项目状态检查 | `python demo/check-project/check_project.py` |
| `advance-project/` | 推进项目阶段 | `python demo/advance-project/advance_project.py` |
| `seed-data/` | 种子数据插入 | `python demo/seed-data/seed_data.py` |
| `test-plugins/` | 插件系统测试 | `python demo/test-plugins/test_plugins.py` |

每个测试子目录有独立的 `README.md` 说明测试目的、运行方式和预期结果。

## 运行方式

### 方式一：一键启动前后端
```bash
# 双击或在终端执行
demo\start_all.bat
```
会打开两个新 cmd 窗口分别运行前后端，主窗口显示启动状态后暂停。

### 方式二：分别启动
```bash
# 终端 1 — 后端
demo\start_backend.bat

# 终端 2 — 前端
demo\start_frontend.bat
```

### 方式三：运行单个测试
```bash
# 确保后端已启动（http://localhost:8000）
python demo/check-api/check_api.py
python demo/verify-api/verify_api.py
```

## 预期结果

| 检查项 | 预期 |
|--------|------|
| start_backend.bat 输出 | 显示 Python/uvicorn/config.yaml 三项检查通过，最后输出 `Starting FastAPI on port 8000...` |
| start_frontend.bat 输出 | 显示 node_modules/npm 检查通过，最后输出 `Starting Vite dev server on port 5173...` |
| 后端访问 | 浏览器打开 http://localhost:8000/docs 可见 Swagger API 文档 |
| 前端访问 | 浏览器打开 http://localhost:5173 可见登录页 |
| 端到端验证 | 可注册账号 → 登录 → 进入 Dashboard → 创建项目 |
| 单个测试 | 每个测试子目录按各自 README 预期输出 |

## 故障排查
- **`Python not found`**：检查 Python 是否在 PATH，或用 `py` 启动器替代
- **`uvicorn not installed`**：执行 `pip install uvicorn fastapi aiosqlite pyjwt cryptography jinja2`
- **`config.yaml not found`**：参考 `backend/config.yaml` 模板创建，必须含 `jwt_secret` 和 `fernet_key`
- **`node_modules not found`**：执行 `cd frontend && npm install`
- **端口被占用**：检查 8000/5173 是否被其他进程占用，用 `netstat -ano | findstr :8000` 排查

## 注意事项
- 三个脚本末尾均有 `pause`，关闭窗口前会等待按键，便于查看错误信息
- start_all.bat 使用 `start "标题" cmd /k` 启动子窗口，关闭主窗口不会关闭子窗口
- 后端使用 `--reload` 热重载，修改 backend 代码会自动重启
- 前端 Vite 自带 HMR，修改 frontend 代码浏览器自动刷新
- 测试程序多依赖独立登录（各自维护 Token），可并行运行互不干扰

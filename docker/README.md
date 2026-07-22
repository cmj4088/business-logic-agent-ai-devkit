# Business Logic Agent — Docker 部署

## 环境要求

- [Docker](https://docs.docker.com/get-docker/) 24+
- [Docker Compose](https://docs.docker.com/compose/install/) V2
- (可选) [Ollama](https://ollama.ai/) — 用于本地 LLM 推理

---

## 快速部署

### 1. 克隆代码

```bash
git clone https://github.com/cmj4088/business-logic-agent.git
cd business-logic-agent
```

### 2. 配置环境变量

```bash
cp docker/.env.example .env
```

编辑 `.env` 文件，至少修改以下安全配置：

```bash
# 生成随机密钥（Linux/Mac）
JWT_SECRET=$(openssl rand -hex 32)
FERNET_KEY=$(openssl rand -base64 32)
```

> ⚠️ **生产环境必改项**：`JWT_SECRET`、`FERNET_KEY`

### 3. 启动服务

```bash
# 后台启动
docker compose up -d

# 查看日志
docker compose logs -f

# 重新构建后启动（代码有修改时）
docker compose up -d --build
```

### 4. 访问

打开浏览器访问 `http://<服务器IP>`（默认端口 80）

---

## 配置 Ollama（推荐）

BLA 默认使用 Ollama 进行本地 LLM 推理。

### 方式一：宿主机安装 Ollama

在宿主机安装 Ollama：

```bash
# Linux
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull qwen2.5

# Windows/Mac: 从 https://ollama.ai/download 下载安装
```

Docker 会自动通过 `host.docker.internal` 连接到宿主机 Ollama。

### 方式二：Docker 部署 Ollama

```yaml
# 在 docker-compose.yml 中添加 Ollama 服务
services:
  ollama:
    image: ollama/ollama:latest
    container_name: bla-ollama
    restart: unless-stopped
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"

volumes:
  ollama_data:
```

然后将 `.env` 中的 `OLLAMA_BASE_URL` 改为 `http://ollama:11434`。

---

## 环境变量说明

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `FRONTEND_PORT` | `80` | 前端 Nginx 端口 |
| `BACKEND_PORT` | `8000` | 后端 API 端口 |
| `DEBUG` | `false` | 调试模式 |
| `JWT_SECRET` | (默认值) | JWT 签名密钥，**生产必须修改** |
| `FERNET_KEY` | (默认值) | 加密密钥，**生产必须修改** |
| `CORS_ORIGINS` | `http://localhost:5173,...` | 允许的跨域源，逗号分隔 |
| `LLM_DEFAULT` | `ollama` | 默认 LLM 类型 |
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` | Ollama 服务地址 |
| `OLLAMA_DEFAULT_MODEL` | `qwen2.5` | 默认模型 |
| `LOG_LEVEL` | `INFO` | 日志级别 |

---

## 常用命令

```bash
# 启动
docker compose up -d

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f backend   # 仅后端日志
docker compose logs -f frontend  # 仅前端日志

# 重启
docker compose restart

# 停止
docker compose down

# 停止并删除数据卷（⚠️ 会清除数据库）
docker compose down -v
```

---

## 架构说明

```
用户浏览器
    │
    ▼  (端口 80)
┌──────────┐
│  Nginx   │  ← 前端容器
│  (SPA)   │
└────┬─────┘
     │ /api/*  /ws/*
     ▼  (内部网络)
┌──────────┐      ┌──────────┐
│ FastAPI  │◄────►│  SQLite  │
│ 后端服务  │      │  数据卷   │
└────┬─────┘      └──────────┘
     │
     ▼ (Ollama API)
┌──────────┐
│  Ollama  │  ← 宿主机或单独容器
│ (LLM)    │
└──────────┘
```

- **Nginx** 同时负责：① 服务前端静态文件 ② 反向代理 API 请求 ③ 转发 WebSocket
- **后端** 使用 SQLite，数据保存在 Docker 卷中，重启不丢失
- **Ollama** 可通过 `host.docker.internal` 连接宿主机实例，也可另起容器

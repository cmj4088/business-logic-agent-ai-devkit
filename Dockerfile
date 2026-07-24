# Business Logic Agent — 统一部署镜像（Zeabur / Railway / Fly.io）
# 单容器：前端(Vite build) + 后端(FastAPI) 合为一体
# 后端自动托管前端静态文件

# ---- 阶段1：构建前端 ----
FROM node:18-alpine AS frontend-builder

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npx tsc --noEmit 2>/dev/null; npm run build

# ---- 阶段2：后端 + 运行 ----
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 创建数据/日志目录
RUN mkdir -p /app/data /app/logs

# 复制后端代码
COPY backend/ /app/backend/
COPY shared/ /app/shared/

# 复制前端构建产物（后端自动检测并挂载）
COPY --from=frontend-builder /app/dist /app/frontend/dist

# 环境变量（Zeabur 面板可覆盖）
ENV APP_NAME="Business Logic Agent"
ENV APP_VERSION="1.0.0"
ENV CORS_ORIGINS="*"
ENV DEBUG=false
ENV LOG_LEVEL=INFO
ENV DATABASE_PATH=/app/data/ipd_agent.db
ENV JWT_ALGORITHM=HS256
ENV SESSION_TOKEN_EXPIRE_MINUTES=60
ENV REFRESH_TOKEN_EXPIRE_DAYS=30
# LLM 配置（可选）
ENV LLM_DEFAULT=ollama
ENV OLLAMA_BASE_URL=http://localhost:11434
ENV OLLAMA_DEFAULT_MODEL=qwen2.5

WORKDIR /app/backend

EXPOSE 8000

# 启动脚本：自动生成密钥，启动服务
COPY docker/startup.py /app/startup.py
CMD ["python", "/app/startup.py"]

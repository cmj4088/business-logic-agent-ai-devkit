#!/bin/bash
# Business Logic Agent — Linux 服务器一键部署脚本
# 用法: sudo bash install.sh
# 前提: U盘已挂载，脚本和 mihomo-*.gz 在同一目录

set -e

echo "========================================"
echo "  BLA Linux 服务器部署脚本"
echo "========================================"

# ---- 1. 安装 Docker ----
echo ""
echo "[1/5] 安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker $SUDO_USER
    echo "  ✓ Docker 安装完成"
else
    echo "  ✓ Docker 已安装，跳过"
fi

# ---- 2. 安装 Clash/Mihomo (TUN 模式) ----
echo ""
echo "[2/5] 安装 Mihomo (Clash TUN 代理)..."

MIHOMO_FILE=$(ls mihomo-linux-amd64-*.gz 2>/dev/null | head -1)
if [ -n "$MIHOMO_FILE" ]; then
    gunzip -f -k "$MIHOMO_FILE"
    MIHOMO_BIN="${MIHOMO_FILE%.gz}"
    chmod +x "$MIHOMO_BIN"
    mv "$MIHOMO_BIN" /usr/local/bin/mihomo
    echo "  ✓ Mihomo 内核已安装到 /usr/local/bin/mihomo"
else
    echo "  ! 未找到本地安装包，从 GitHub 下载..."
    wget -q https://github.com/MetaCubeX/mihomo/releases/latest/download/mihomo-linux-amd64.gz
    gunzip mihomo-linux-amd64.gz
    chmod +x mihomo-linux-amd64
    mv mihomo-linux-amd64 /usr/local/bin/mihomo
    echo "  ✓ Mihomo 已下载安装"
fi

mkdir -p /etc/clash

cat > /etc/clash/config.yaml << 'CLASH_EOF'
# ======== 请在此粘贴你的代理订阅配置 ========
# TUN 模式配置
tun:
  enable: true
  stack: system
  dns-hijack:
    - any:53
  auto-route: true
  auto-detect-interface: true

dns:
  enable: true
  listen: 0.0.0.0:53
  default-nameserver:
    - 114.114.114.114
    - 223.5.5.5
  nameserver:
    - https://doh.alidns.com/dns-query
    - https://doh.pub/dns-query
CLASH_EOF

echo "  ! 请编辑 /etc/clash/config.yaml，填入你的代理配置"
echo "  ! 编辑器: sudo nano /etc/clash/config.yaml"

cat > /etc/systemd/system/clash.service << 'SERVICE_EOF'
[Unit]
Description=Clash Meta (Mihomo) Daemon
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/mihomo -d /etc/clash
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
SERVICE_EOF

systemctl daemon-reload
echo "  ✓ Clash 系统服务已创建"

# ---- 3. 复制项目代码 ----
echo ""
echo "[3/5] 复制项目代码..."

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

if [ -f "$PROJECT_DIR/docker-compose.yml" ]; then
    echo "  ✓ 项目代码已就绪: $PROJECT_DIR"
else
    PARENT_DIR="$(dirname "$SCRIPT_DIR")"
    if [ -f "$PARENT_DIR/docker-compose.yml" ]; then
        PROJECT_DIR="$PARENT_DIR"
        echo "  ✓ 项目代码已就绪: $PROJECT_DIR"
    else
        echo "  ! 未找到项目文件，请手动复制项目到服务器"
        echo "  ! 或运行: git clone https://github.com/cmj4088/business-logic-agent.git"
    fi
fi

# ---- 4. 配置并启动 BLA ----
echo ""
echo "[4/5] 配置并启动 BLA..."

cd "$PROJECT_DIR"

JWT_SECRET=$(openssl rand -hex 32)
FERNET_KEY=$(openssl rand -base64 32)

if [ ! -f .env ]; then
    cat > .env << ENV_EOF
VITE_API_BASE_URL=
APP_NAME=Business Logic Agent
APP_VERSION=0.1.0
DEBUG=false
CORS_ORIGINS=http://localhost,http://localhost:5173
JWT_SECRET=${JWT_SECRET}
FERNET_KEY=${FERNET_KEY}
DATABASE_PATH=data/ipd_agent.db
LLM_DEFAULT=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_DEFAULT_MODEL=qwen2.5
LOG_LEVEL=INFO
BACKEND_PORT=8000
FRONTEND_PORT=80
ENV_EOF
    echo "  ✓ .env 配置文件已自动生成"
else
    echo "  ✓ .env 已存在，跳过"
fi

if ! docker info &> /dev/null; then
    echo "  ! Docker 未运行，请先启动 Docker 后再执行后续步骤"
    echo "  $ sudo systemctl start docker"
    echo "  $ cd $PROJECT_DIR && docker compose up -d --build"
else
    echo "  启动 Docker 服务..."
    docker compose up -d --build
    echo "  ✓ BLA 已启动！"
fi

echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo ""
echo "  1. 启动 Clash 代理（配置好 config.yaml 后）:"
echo "     sudo systemctl start clash"
echo "     sudo systemctl enable clash"
echo ""
echo "  2. 访问 BLA 系统:"
echo "     http://$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}'):${FRONTEND_PORT:-80}"
echo ""
echo "  3. 常用命令:"
echo "     docker compose logs -f"
echo "     docker compose down"
echo ""
echo "========================================"

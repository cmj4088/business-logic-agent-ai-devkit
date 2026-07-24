#!/bin/bash
#
# Business Logic Agent — Linux Docker 部署脚本
# 用法: sudo bash deploy.sh [端口号]
# 默认端口: 8000
# 功能: 从U盘本地源码构建 Docker 镜像并启动后端服务
#       无需连接 GitHub，所有源码文件已在U盘上
#
# 适用于: Ubuntu / Debian / CentOS / RHEL / Fedora
#

# 不启用 set -e，手动处理关键步骤的错误
# set -e 会导致 apt 等命令失败时脚本静默退出

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PORT="${1:-8000}"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     Business Logic Agent — Docker 部署                      ║"
echo "║     本地构建 · 无需 GitHub · 离线可用                       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# ---- 检查 root 权限 ----
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}[⚠] 建议以 root 权限运行（sudo）以确保 Docker 可用${NC}"
fi

# ---- 1. 检查 Docker ----
echo -e "${CYAN}[1/4]${NC} 检查 Docker 环境 ..."
if ! command -v docker &>/dev/null; then
    echo -e "  ${RED}❌ Docker 未安装，请先安装 Docker${NC}"
    echo "     参考: https://docs.docker.com/engine/install/"
    exit 1
fi
echo -e "  ${GREEN}✅ Docker 已安装${NC}"
docker --version

# ---- 确保 docker compose 插件可用 ----
# 已安装 Docker 但缺少 compose 插件很常见，直接下载二进制到插件目录
if ! docker compose version &>/dev/null; then
    echo -e "  ${YELLOW}⏳ docker compose 插件未安装，正在下载 ...${NC}"

    # 先试系统包管理器（最省事）
    INSTALL_OK=false
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        case "$ID" in
            ubuntu|debian)
                apt-get update -qq 2>/dev/null
                apt-get install -y -qq docker-compose-plugin 2>/dev/null && INSTALL_OK=true
                ;;
            centos|rhel|fedora)
                yum install -y -q docker-compose-plugin 2>/dev/null && INSTALL_OK=true
                ;;
        esac
    fi

    # 包管理器失败 → 从U盘本地安装
    if [ "$INSTALL_OK" = false ]; then
        echo "  ⏳ 从U盘本地安装 docker compose 二进制 ..."
        SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        COMPOSE_BIN="$SCRIPT_DIR/docker-compose-linux-x86_64"

        if [ -f "$COMPOSE_BIN" ]; then
            PLUGIN_DIR="/usr/local/lib/docker/cli-plugins"
            mkdir -p "$PLUGIN_DIR"
            cp "$COMPOSE_BIN" "$PLUGIN_DIR/docker-compose"
            chmod +x "$PLUGIN_DIR/docker-compose"
            echo -e "  ${GREEN}✅ 从U盘安装完成${NC}"
            INSTALL_OK=true
        else
            echo -e "  ${RED}❌ U盘上未找到 docker-compose-linux-x86_64${NC}"
            echo "    请确认该文件在 deploy.sh 同目录下"
            exit 1
        fi
    fi

    if ! docker compose version &>/dev/null; then
        echo -e "  ${RED}❌ docker compose 安装后仍不可用${NC}"
        exit 1
    fi
    echo -e "  ${GREEN}✅ docker compose 插件就绪: $(docker compose version)${NC}"
fi

# ---- 2. 准备部署目录 ----
echo -e "${CYAN}[2/4]${NC} 准备部署文件 ..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "  工作目录: $SCRIPT_DIR"
echo "  后端端口: $PORT"

# 检查必要文件
for f in docker-compose.yml docker/Dockerfile.backend backend/requirements.txt; do
    if [ ! -f "$f" ]; then
        echo -e "  ${RED}❌ 缺少文件: $f${NC}"
        echo "     请确认 deploy.sh 在U盘根目录运行"
        echo "     需要以下文件:"
        echo "       ├── deploy.sh          (本脚本)"
        echo "       ├── docker-compose.yml"
        echo "       ├── .dockerignore"
        echo "       ├── docker/"
        echo "       │   └── Dockerfile.backend"
        echo "       ├── backend/"
        echo "       │   ├── requirements.txt"
        echo "       │   ├── config.yaml"
        echo "       │   └── m0_infrastructure/ ..."
        echo "       └── shared/"
        exit 1
    fi
done

# ---- 3. 构建 Docker 镜像 ----
echo -e "${CYAN}[3/4]${NC} 构建 Docker 镜像（本地源码）..."
echo -e "  ${YELLOW}首次构建约需 3-5 分钟，后续可重用缓存${NC}"

export BACKEND_PORT="$PORT"

# 构建后端镜像（直接从本地 Dockerfile 构建，不依赖网络拉取代码）
docker compose build backend 2>&1 | while IFS= read -r line; do
    echo "    $line"
done

BUILD_EXIT=${PIPESTATUS[0]}
if [ "$BUILD_EXIT" -ne 0 ]; then
    echo -e "  ${RED}❌ 构建失败，请检查上方错误信息${NC}"
    echo ""
    echo "  常见原因:"
    echo "    - 网络不通（需要拉取 python:3.11-slim 基础镜像）"
    echo "    - 磁盘空间不足"
    echo "    - Docker 服务未运行"
    exit 1
fi
echo -e "  ${GREEN}✅ 镜像构建成功${NC}"

# ---- 4. 启动容器 ----
echo -e "${CYAN}[4/4]${NC} 启动后端服务 ..."

# 检查是否已有同名容器在运行
if docker ps -a --format '{{.Names}}' | grep -q '^bla-backend$'; then
    echo -e "  ${YELLOW}⏳ 发现旧容器，正在移除 ...${NC}"
    docker stop bla-backend 2>/dev/null || true
    docker rm bla-backend 2>/dev/null || true
fi

docker compose up -d backend
echo -e "  ${GREEN}✅ 容器已启动${NC}"

# ---- 检查状态 ----
echo ""
sleep 2
if docker ps --format '{{.Status}}' --filter name=bla-backend | grep -q 'Up'; then
    echo -e "  ${GREEN}✅ 后端服务运行中${NC}"

    # 获取容器 IP
    CONTAINER_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' bla-backend 2>/dev/null)

    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                             ║"
    echo "║   🚀 Business Logic Agent 后端已就绪！                      ║"
    echo "║                                                             ║"
    printf "║   本地访问:   http://localhost:%-13s                ║\n" "$PORT"
    if [ -n "$CONTAINER_IP" ]; then
        printf "║   容器内网:   http://%s:%-13s               ║\n" "$CONTAINER_IP" "$PORT"
    fi
    echo "║                                                             ║"
    echo "║   API 文档:   http://localhost:$PORT/docs                   ║"
    echo "║   API 文档:   http://localhost:$PORT/redoc                  ║"
    echo "║                                                             ║"
    echo "║   📋 常用命令:                                             ║"
    echo "║     查看日志:  docker logs -f bla-backend                  ║"
    echo "║     停止服务:  docker compose down                         ║"
    echo "║     重启服务:  docker compose restart backend              ║"
    echo "║                                                             ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""

    # 测试 API 连通性
    echo -e "${CYAN}[测试]${NC} 检查 API 响应 ..."
    sleep 2
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/docs" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" != "000" ]; then
        echo -e "  ${GREEN}✅ API 文档可访问（HTTP $HTTP_CODE）${NC}"
    else
        echo -e "  ${YELLOW}⚠  无法访问 API 文档，请检查防火墙或端口冲突${NC}"
        echo "    尝试: curl -v http://localhost:$PORT/docs"
    fi
else
    echo -e "  ${RED}❌ 容器启动失败，查看日志:${NC}"
    echo "  docker logs bla-backend"
    docker compose logs backend --tail 20 2>/dev/null || true
    exit 1
fi

echo ""
echo -e "${GREEN}部署完成！${NC}"

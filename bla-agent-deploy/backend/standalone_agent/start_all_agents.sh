#!/bin/bash
# =============================================================================
# BLA Standalone Agents — 一键启动全部 6 个独立智能体
# =============================================================================
# 每个 Agent 在独立端口上运行，可通过 URL 注册到主引擎。
# 主引擎端口: 8000
# 各 Agent 端口: 8001-8006
# =============================================================================

set -e

ROLES=("product_manager" "rd" "qa" "marketing" "manufacturing" "finance")
NAMES=("产品经理" "研发架构师" "测试专家" "市场专家" "制造工程师" "财务分析师")
PORTS=(8001 8002 8003 8004 8005 8006)

BASE_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$BASE_DIR"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     BLA Standalone Agents — 一键启动全部智能体              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# 检查 Python
if ! command -v python &> /dev/null; then
    echo "[错误] 未找到 Python，请确保 Python 3.11+ 已安装"
    exit 1
fi

# 启动所有 Agent
PIDS=()
for i in "${!ROLES[@]}"; do
    ROLE="${ROLES[$i]}"
    NAME="${NAMES[$i]}"
    PORT="${PORTS[$i]}"

    echo "[启动] $NAME ($ROLE) → 端口 $PORT"
    python -m standalone_agent.runner --role "$ROLE" --port "$PORT" --host "0.0.0.0" &
    PIDS+=($!)
    sleep 1  # 避免端口竞争
done

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  全部 Agent 已启动！                                       ║"
echo "║                                                             ║"
echo "║  Agent             端口  URL                                ║"
echo "║  ─────────────────────────────────────────────────────       ║"
for i in "${!ROLES[@]}"; do
    printf "║  %-18s %4d  http://localhost:%d\n" "${NAMES[$i]}" "${PORTS[$i]}" "${PORTS[$i]}"
done
echo "║                                                             ║"
echo "║  注册到主引擎:                                              ║"
echo "║  POST /api/agents/registry                                  ║"
echo "║  {\"role\": \"product_manager\", \"url\": \"http://localhost:8001\"}  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# 捕获 Ctrl+C 停止所有
trap "echo '正在停止所有 Agent...'; kill ${PIDS[*]} 2>/dev/null; exit 0" SIGINT SIGTERM

# 等待所有子进程
wait

#!/bin/bash
# =============================================================================
# BLA Standalone Agent — Linux 服务器部署脚本
# =============================================================================
# 用法:
#   1. 上传 bla-agent-v1.0.0.zip 到服务器
#   2. 解压: unzip bla-agent-v1.0.0.zip
#   3. 运行: cd bla-agent-deploy && bash deploy.sh
# =============================================================================

set -e

# 自动检测项目目录（支持多个可能的名称）
DETECTED=""
for dir in "/root/business-logic-agent" "/root/business-logic-agent-ai-devkit" "/root/Business-logic-agents" "/root/bla" "/opt/business-logic-agent" "/opt/business-logic-agent-ai-devkit"; do
    if [ -d "$dir/backend" ]; then
        DETECTED="$dir"
        break
    fi
done

# 默认值：自动检测 或 手动指定
BLA_HOME="${DETECTED:-/root/business-logic-agent-ai-devkit}"

# 如果传了参数，使用参数路径
if [ -n "$1" ]; then
    BLA_HOME="$1"
fi
echo "╔════════════════════════════════════════════════════╗"
echo "║  BLA Standalone Agent — 部署脚本                   ║"
echo "║  目标目录: $BLA_HOME"
echo "╚════════════════════════════════════════════════════╝"

# ── 第一步：复制文件 ──
echo ""
echo "[1/4] 复制新文件到 BLA 目录..."

# 创建 standalone_agent 目录
mkdir -p "$BLA_HOME/backend/standalone_agent"
cp -v backend/standalone_agent/*.py "$BLA_HOME/backend/standalone_agent/"
cp -v backend/standalone_agent/start_all_agents.sh "$BLA_HOME/backend/standalone_agent/"
chmod +x "$BLA_HOME/backend/standalone_agent/start_all_agents.sh"

# 创建 agents 目录（Agent 清单）
mkdir -p "$BLA_HOME/backend/agents"
cp -v backend/agents/*.json "$BLA_HOME/backend/agents/"

# 复制迁移文件
cp -v backend/m0_infrastructure/migrations/v008_agent_registry.sql \
      "$BLA_HOME/backend/m0_infrastructure/migrations/"

# 覆盖修改过的文件（建议先备份）
echo "  备份原文件到 .bak..."
cp "$BLA_HOME/backend/m0_infrastructure/main.py" "$BLA_HOME/backend/m0_infrastructure/main.py.bak"
cp "$BLA_HOME/backend/m4_agent_orchestration/orchestrator.py" "$BLA_HOME/backend/m4_agent_orchestration/orchestrator.py.bak"
cp "$BLA_HOME/backend/m4_agent_orchestration/router.py" "$BLA_HOME/backend/m4_agent_orchestration/router.py.bak"

cp -v main.py "$BLA_HOME/backend/m0_infrastructure/main.py"
cp -v orchestrator.py "$BLA_HOME/backend/m4_agent_orchestration/orchestrator.py"
cp -v router.py "$BLA_HOME/backend/m4_agent_orchestration/router.py"

echo "  [完成] 文件复制完毕"

# ── 第二步：安装依赖 ──
echo ""
echo "[2/4] 安装 Python 依赖..."
cd "$BLA_HOME/backend"
pip install httpx --quiet
echo "  [完成] 依赖安装完毕"

# ── 第三步：执行数据库迁移 ──
echo ""
echo "[3/4] 执行数据库迁移 (v008)..."
cd "$BLA_HOME/backend"
python -c "
import asyncio, sqlite3, os
db_path = os.environ.get('DATABASE_PATH', 'data/ipd_agent.db')
conn = sqlite3.connect(db_path)
with open('m0_infrastructure/migrations/v008_agent_registry.sql', 'r') as f:
    sql = f.read()
conn.executescript(sql)
conn.commit()
conn.close()
print('  [完成] 迁移 v008 已执行')
"
echo "  [完成] 数据库迁移完毕"

# ── 第四步：启动 Agent ──
echo ""
echo "[4/4] 启动独立 Agent 服务..."
cd "$BLA_HOME/backend"

# 停止已有的 Agent（如果有）
for port in 8001 8002 8003 8004 8005 8006; do
    pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        echo "  停止端口 $port 上的旧进程 (PID: $pid)"
        kill $pid 2>/dev/null || true
    fi
done

# 启动全部 6 个 Agent
ROLES=("product_manager" "rd" "qa" "marketing" "manufacturing" "finance")
NAMES=("PM" "RD" "QA" "MKT" "MFG" "FIN")
PORTS=(8001 8002 8003 8004 8005 8006)

for i in "${!ROLES[@]}"; do
    ROLE="${ROLES[$i]}"
    NAME="${NAMES[$i]}"
    PORT="${PORTS[$i]}"

    nohup python -m standalone_agent.runner \
        --role "$ROLE" \
        --port "$PORT" \
        --host "0.0.0.0" \
        > "logs/agent-${ROLE}.log" 2>&1 &

    echo "  [启动] $NAME ($ROLE) → 端口 $PORT (PID: $!)"
    sleep 1
done

# ── 第五步：验证 ──
echo ""
echo "════════════════════════════════════════════════════"
echo "  验证部署"
echo "════════════════════════════════════════════════════"
sleep 2
for i in "${!ROLES[@]}"; do
    PORT="${PORTS[$i]}"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/health" 2>/dev/null || echo "000")
    if [ "$STATUS" = "200" ]; then
        NAME=$(curl -s "http://localhost:$PORT/health" | python3 -c "import sys,json; print(json.load(sys.stdin)['agent_name'])" 2>/dev/null || echo "?")
        echo "  ✅ 端口 $PORT — $NAME — 健康检查通过"
    else
        echo "  ❌ 端口 $PORT — 未响应 (HTTP $STATUS)"
    fi
done

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║  部署完成！                                        ║"
echo "║                                                    ║"
echo "║  Agent URL 列表:                                   ║"
for i in "${!ROLES[@]}"; do
    printf "║    http://<服务器IP>:%d  (%s)\n" "${PORTS[$i]}" "${NAMES[$i]}"
done
echo "║                                                    ║"
echo "║  注册到主引擎:                                      ║"
echo "║    curl -X POST http://localhost:8000/api/agents/registry \\"
echo "║      -H 'Authorization: Bearer <token>' \\"
echo "║      -d '{\"role\":\"product_manager\",\"url\":\"http://localhost:8001\"}'"
echo "║                                                    ║"
echo "║  查看日志:                                          ║"
echo "║    tail -f backend/logs/agent-*.log                ║"
echo "╚════════════════════════════════════════════════════╝"

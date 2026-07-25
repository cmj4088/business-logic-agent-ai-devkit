# Standalone Agent — 独立智能体设计文档

> **版本**：v1.0
> **日期**：2026-07-25
> **状态**：已实现

---

## 一、设计目标

将 BLA 内置的 6 个 IPD Agent 角色（产品经理、研发、测试、市场、制造、财务）改造为**可独立部署的微服务**，支持通过 HTTP URL 注册与发现，实现分布式 Agent 编排。

### 核心能力

1. **独立部署**：每个 Agent 角色可作为独立进程/容器运行
2. **URL 注册**：通过 HTTP 端点发现和注册远程 Agent
3. **热插拔**：运行时注册/注销远程 Agent，无需重启引擎
4. **兼容现有**：不破坏现有本地编排模式，远程 Agent 不可用时自动降级到本地

---

## 二、架构设计

```
                        ┌─────────────────────────────┐
                        │     BLA 主引擎（:8000）      │
                        │                              │
                        │  AgentRegistryClient          │
                        │  ┌─────────────────────────┐  │
                        │  │ 本地 Agent 缓存           │  │
                        │  │ 远程 Agent 注册表         │  │
                        │  └─────────────────────────┘  │
                        │                              │
                        │  Orchestrator                 │
                        │  ├── _invoke_agent()          │
                        │  │   ├── 远程 Agent? ──→ HTTP │
                        │  │   └── 否 ──→ 本地 LLM     │
                        │  └── ...                      │
                        └──────────────┬───────────────┘
                                       │
          ┌─────────────┬──────────────┼──────────────┬─────────────┐
          ▼             ▼              ▼              ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ PM Agent │  │ RD Agent │  │ QA Agent │  │ MKT Agent│  │ MFG/Fin  │
    │ :8001    │  │ :8002    │  │ :8003    │  │ :8004    │  │ :8005-6  │
    └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
         │             │             │             │             │
         └─────────────┴─────────────┴─────────────┴─────────────┘
                                     │
                              ┌──────┴──────┐
                              │  LLM Backend │
                              │ (Ollama/API) │
                              └─────────────┘
```

### 通信协议

| 方向 | 协议 | 格式 | 说明 |
|------|------|------|------|
| 引擎 → Agent | HTTP POST | JSON | 推理请求（/infer） |
| Agent → 引擎 | HTTP Response | JSON | 推理响应 |
| 引擎 → Agent | HTTP GET | - | 健康检查（/health） |
| 引擎 → Agent | HTTP GET | JSON | 获取清单（/manifest） |

---

## 三、API 规范

### Agent 服务端 API

每个独立 Agent 服务提供以下三个端点：

#### `GET /health` — 健康检查

```json
{
  "status": "ok",
  "agent_id": "product_manager",
  "agent_name": "产品经理小王",
  "timestamp": 1721900000.0,
  "version": "1.0.0"
}
```

#### `GET /manifest` — 获取 Agent 清单

返回 AgentManifest 完整信息，供引擎注册时发现 Agent 能力。

#### `POST /infer` — 执行推理

**请求**：
```json
{
  "system_prompt": "你是一位资深产品经理...",
  "user_message": "请分析智能音箱的目标市场",
  "model": "ollama",
  "temperature": 0.7,
  "max_tokens": 32000
}
```

**响应**：
```json
{
  "content": "根据市场分析，智能音箱的目标市场...",
  "model": "qwen2.5",
  "provider": "ollama",
  "tokens": { "input": 1200, "output": 800 }
}
```

### 主引擎注册 API

#### `POST /api/agents/registry` — 注册远程 Agent

```json
{
  "role": "product_manager",
  "url": "http://192.168.1.100:8001",
  "name": "产品经理小王（远程）",
  "api_key": "可选"
}
```

#### `GET /api/agents/registry` — 列出所有注册 Agent

#### `DELETE /api/agents/registry/{role}` — 取消注册

#### `POST /api/agents/registry/health` — 批量健康检查

---

## 四、Agent 清单格式（AgentManifest）

Agent 使用 JSON 格式的清单文件进行自描述：

```json
{
  "id": "product_manager",
  "name": "产品经理小王",
  "role": "product_manager",
  "version": "1.0.0",
  "description": "负责需求分析、市场调研、产品定义...",
  "capabilities": {
    "applicable_stages": ["concept", "plan", "launch"],
    "applicable_activities": ["market_research", "mrd_writing", "prd_writing"],
    "output_types": ["mrd", "prd", "competitor_analysis", "roadmap"]
  },
  "default_model": "ollama",
  "supported_models": ["ollama", "deepseek", "anthropic", "openai"]
}
```

清单文件存储在 `backend/agents/{role}.json`，启动时自动加载。

---

## 五、启动方式

### 启动单个 Agent

```bash
# 启动产品经理 Agent（端口 8001）
python -m standalone_agent.runner --role product_manager --port 8001

# 使用自定义 Manifest 文件
python -m standalone_agent.runner --manifest /path/to/manifest.json --port 8001
```

### 启动全部 6 个 Agent

```bash
# Linux/Mac
bash backend/standalone_agent/start_all_agents.sh

# Windows
cd backend
python -m standalone_agent.runner --role product_manager --port 8001
python -m standalone_agent.runner --role rd --port 8002
# ... 每个角色一个窗口
```

### 注册到主引擎

```bash
curl -X POST http://localhost:8000/api/agents/registry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"role": "product_manager", "url": "http://localhost:8001"}'
```

---

## 六、编排集成

编排器（Orchestrator）的 `_invoke_agent()` 方法已更新如下：

```
_invoke_agent(agent_role, context):
  1. 渲染 system_prompt（同现有逻辑）
  2. 检查 AgentRegistry 中是否有已注册的远程 Agent
     ├── 是 → 调用 POST {url}/infer
     │        ├── 成功 → 返回远程结果
     │        └── 失败 → 降级到本地 LLM
     └── 否 → 使用本地 LLM（现有逻辑）
  3. 返回统一格式的结果
```

注册的远程 Agent 可覆盖内置角色。例如注册一个远程的 `product_manager` 后，所有产品经理角色的编排都会路由到该远程服务。

---

## 七、文件清单

| 文件 | 说明 |
|------|------|
| `backend/standalone_agent/__init__.py` | 包入口 |
| `backend/standalone_agent/manifest.py` | AgentManifest 模型定义 |
| `backend/standalone_agent/server.py` | 独立 Agent FastAPI 服务器 |
| `backend/standalone_agent/registry.py` | Agent 注册客户端 |
| `backend/standalone_agent/runner.py` | CLI 启动器 |
| `backend/standalone_agent/start_all_agents.sh` | 一键启动脚本 |
| `backend/agents/product_manager.json` | 产品经理 Agent 清单 |
| `backend/agents/rd.json` | 研发架构师 Agent 清单 |
| `backend/agents/qa.json` | 测试专家 Agent 清单 |
| `backend/agents/marketing.json` | 市场专家 Agent 清单 |
| `backend/agents/manufacturing.json` | 制造工程师 Agent 清单 |
| `backend/agents/finance.json` | 财务分析师 Agent 清单 |
| `backend/m0_infrastructure/migrations/v008_agent_registry.sql` | 数据库迁移 |
| `backend/m4_agent_orchestration/orchestrator.py` | 更新后的编排器（支持远程 Agent） |
| `backend/m4_agent_orchestration/router.py` | 更新后的路由（注册端点） |
| `backend/m0_infrastructure/main.py` | 更新后的启动逻辑 |

# Standalone Agent — 独立智能体系统 代码说明

## 目录: backend/standalone_agent/
- **路径**: `backend/standalone_agent/`
- **作用**: 实现 IPD Agent 角色的独立部署能力，每个角色可作为独立微服务运行
- **核心功能**: URL 注册与发现、远程推理调用、健康检查、清单自描述
- **最后修改**: 2026-07-25
- **修改原因**: 新增独立智能体系统

---

## 文件: __init__.py
- **路径**: `backend/standalone_agent/__init__.py`
- **作用**: 包入口，导出核心类型
- **导出**: AgentManifest, AgentCapability, AgentRegistryClient

## 文件: manifest.py
- **路径**: `backend/standalone_agent/manifest.py`
- **作用**: Agent 清单模型定义（自描述格式）
- **关键类**:
  - `AgentManifest`: Agent 元数据（id, name, role, version, url, capabilities 等）
  - `AgentCapability`: Agent 能力声明（适用阶段、活动、输出类型）
  - `AgentInferRequest`: 推理请求模型（system_prompt, user_message, model 等）
  - `AgentInferResponse`: 推理响应模型（content, model, provider, tokens）
  - `AgentRegisterRequest`: 注册请求模型（role, url, name, api_key）
- **依赖关系**:
  - 依赖: pydantic
  - 被引用: server.py, registry.py, runner.py, router.py

## 文件: server.py
- **路径**: `backend/standalone_agent/server.py`
- **作用**: 独立 Agent 的 FastAPI 服务器
- **关键函数**:
  - `create_agent_app(role, manifest)`: 创建 FastAPI 应用实例（含 /health, /manifest, /infer 端点）
  - `_detect_provider(model)`: 根据模型名称检测提供商
- **端点**:
  - `GET /health`: 健康检查
  - `GET /manifest`: 获取 Agent 清单
  - `POST /infer`: 执行推理（调用 LLM）
- **依赖关系**:
  - 引入: LLMRouter, PromptRenderer, AgentManifest
  - 被引用: runner.py

## 文件: registry.py
- **路径**: `backend/standalone_agent/registry.py`
- **作用**: Agent 注册与发现客户端
- **关键类**:
  - `AgentRegistryClient`: 管理本地+远程 Agent 注册
- **关键函数**:
  - `register_local(manifest)`: 注册本地内置 Agent
  - `register_remote(request)`: 通过 URL 注册远程 Agent（获取 Manifest + 验证 + 持久化）
  - `unregister(role)`: 取消注册
  - `list_agents()`: 列出所有 Agent
  - `call_remote(role, ...)`: 调用远程 Agent 推理
  - `health_check_all()`: 批量健康检查
  - `load_from_db()`: 从数据库加载持久化的注册信息
- **依赖关系**:
  - 引入: httpx, AgentManifest, AgentInferRequest
  - 被引用: orchestrator.py, router.py, main.py

## 文件: runner.py
- **路径**: `backend/standalone_agent/runner.py`
- **作用**: CLI 启动器，通过命令行启动独立 Agent
- **关键函数**:
  - `main()`: 解析参数 → 创建 Manifest → 启动 uvicorn 服务
  - `_get_role_capabilities(role)`: 返回各角色的默认能力声明
- **命令行参数**:
  - `--role`: Agent 角色（product_manager/rd/qa/marketing/manufacturing/finance）
  - `--port`: 服务端口（默认 8001）
  - `--host`: 监听地址（默认 0.0.0.0）
  - `--manifest`: JSON 文件路径（替代 --role）
  - `--model`: 默认模型
- **依赖关系**:
  - 引入: server.py, manifest.py
  - 使用方式: `python -m standalone_agent.runner --role product_manager --port 8001`

---

## 目录: backend/agents/
- **路径**: `backend/agents/`
- **作用**: 存放 6 个 IPD Agent 角色的 JSON 清单文件
- **文件列表**: product_manager.json, rd.json, qa.json, marketing.json, manufacturing.json, finance.json
- **启动时**: main.py 自动扫描此目录加载所有清单

---

## 依赖关系总图

```
main.py (启动注册)
  └→ AgentRegistryClient.register_local()
      └→ AgentManifest (来自 agents/*.json)

router.py (API 端点)
  └→ AgentRegistryClient.register_remote()  # POST /api/agents/registry
  └→ AgentRegistryClient.list_agents()       # GET /api/agents/registry
  └→ AgentRegistryClient.unregister()        # DELETE /api/agents/registry/{role}
  └→ AgentRegistryClient.health_check_all()  # POST /api/agents/registry/health

orchestrator.py (编排调用)
  └→ AgentRegistryClient.is_remote_agent()
  └→ AgentRegistryClient.call_remote()
      └→ HTTP POST {url}/infer

standalone_agent/runner.py (独立进程)
  └→ create_agent_app()
      └→ LLMRouter.call()  # 调用本地或远程 LLM
```

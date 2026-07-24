# router.py — Agent 编排 API 路由

## 概述
该文件定义了 M4 Agent 编排模块的 FastAPI 路由，对外暴露 Agent 编排相关的 REST API 端点。包括触发 Agent 协作、获取可用模型列表、测试模型连接和获取 Agent 配置列表。

## 函数/类详细说明

### router（模块级 FastAPI APIRouter 实例）
- **功能**: FastAPI 路由器实例
- **配置**: 前缀 `/api/agents`，标签 `"Agent 编排"`
- **说明**: 所有路由都挂载在此路由器下，由主应用注册

### POST /api/agents/orchestrate — orchestrate()
- **功能**: 触发 Agent 协作编排
- **请求体**: OrchestrateRequest（project_id, stage, activity_key, mode, agents, user_input, max_rounds）
- **认证**: 需要当前用户（`Depends(get_current_user)`）
- **数据库**: 需要数据库会话（`Depends(get_db)`）
- **返回值**: 统一响应格式 `{"data": {...}, "error": None, "meta": {"request_id": ""}}`
- **关键逻辑**: 创建 Orchestrator 实例，调用其 orchestrate() 方法，将结果包装在统一响应格式中

### GET /api/agents/models — list_models()
- **功能**: 获取可用模型列表
- **认证**: 需要当前用户
- **返回值**: 包含三个提供商的模型列表：
  - ollama（本地）: qwen2.5, llama3.2, deepseek-r1
  - anthropic（云端）: claude-sonnet-4-5, claude-haiku-4-5
  - openai（云端）: gpt-4o, gpt-4o-mini
- **关键逻辑**: 静态返回硬编码的模型列表，每个提供商包含 name、label、models 数组和 default 标记

### POST /api/agents/models/test — test_model()
- **功能**: 测试模型连接
- **请求体**: ModelTestRequest（model, provider）
- **认证**: 需要当前用户
- **返回值**: 统一响应格式，data 中包含测试结果（success, model, provider, latency_ms, tokens 或 error）
- **关键逻辑**: 创建 LLMRouter 实例，调用 test_connection() 方法

### GET /api/agents/configs — list_configs()
- **功能**: 获取 Agent 配置列表
- **认证**: 需要当前用户
- **返回值**: 统一响应格式，data 中包含所有 Agent 角色的配置（role, name, model, temperature, max_tokens）
- **关键逻辑**: 从 m3_prompt_system.renderer 导入 ROLE_NAMES，遍历生成配置列表，默认值均为硬编码（model="ollama", temperature=0.7, max_tokens=32000）

## 依赖关系
- `fastapi.APIRouter, Depends`: FastAPI 路由和依赖注入
- `sqlalchemy.ext.asyncio.AsyncSession`: 异步数据库会话
- `m0_infrastructure.database.get_db`: 数据库会话依赖
- `m1_auth_security.middleware.get_current_user`: 用户认证依赖
- `.models.OrchestrateRequest, AgentConfigRequest, ModelTestRequest`: 请求体模型
- `.orchestrator.Orchestrator`: Agent 编排器
- `.llm_router.LLMRouter`: LLM 路由器

## 注意事项
- 所有端点都使用了 `get_current_user` 依赖进行认证，需要有效的用户会话
- 模型列表和配置列表目前是硬编码的，后续可能需要改为从数据库或配置文件动态读取
- AgentConfigRequest 被导入但未在任何路由中使用，可能是预留的模型
- 统一响应格式 `{"data": ..., "error": None, "meta": {"request_id": ""}}` 中 request_id 目前为空字符串，未实现请求追踪
- orchestrator 的 `_save_round()` 中 cost_usd 固定为 0.0，因为默认使用 Ollama 免费模型；如果切换到付费模型，需要在路由层或编排器中实现费用计算
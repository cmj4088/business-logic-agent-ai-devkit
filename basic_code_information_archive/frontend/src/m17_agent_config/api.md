# m17_agent_config/api.ts — Agent 配置模块 API 调用层

## 概述
Agent 配置模块的 API 调用封装，包含提示词模板 CRUD、模型测试、模型列表获取、API Key 管理等功能。

## 函数详细说明

### fetchPromptTemplates()
- **功能**: 获取所有提示词模板
- **返回值**: `Promise<PromptTemplate[]>`
- **API 端点**: `GET /api/prompts/templates`

### fetchPromptTemplateByRole(role)
- **功能**: 获取特定角色提示词模板
- **返回值**: `Promise<PromptTemplate>`
- **API 端点**: `GET /api/prompts/templates/{role}`

### updatePromptTemplate(role, data)
- **功能**: 更新提示词模板
- **返回值**: `Promise<PromptTemplate>`
- **API 端点**: `PUT /api/prompts/templates/{role}`

### previewPrompt(data)
- **功能**: 预览渲染后的提示词
- **返回值**: `Promise<PromptPreviewResponse>`
- **API 端点**: `POST /api/prompts/preview`

### testModelConnection(data)
- **功能**: 测试 LLM 连接
- **返回值**: `Promise<ModelTestResponse>`
- **API 端点**: `POST /api/agents/test`

### fetchAvailableModels()
- **功能**: 获取可用模型列表
- **返回值**: `Promise<ModelInfo[]>`
- **API 端点**: `GET /api/agents/models`

### fetchOllamaModels(ollamaUrl)
- **功能**: 获取 Ollama 可用模型列表
- **返回值**: `Promise<ModelInfo[]>`
- **API 端点**: `GET /api/agents/models?ollama_url={url}`

### saveApiKey(backend, apiKey)
- **功能**: 保存 API Key（加密存储）
- **返回值**: `Promise<void>`
- **API 端点**: `POST /api/agents/api-keys`

### getApiKeyStatus()
- **功能**: 获取 API Key 状态（是否已配置）
- **返回值**: `Promise<Record<string, boolean>>`
- **API 端点**: `GET /api/agents/api-keys/status`

## 依赖关系
- 导入 `get`, `post`, `put` from `@/shared/api-client`
- 导入各种类型 from `./types`

## 注意事项
- Ollama 模型获取需要传入 Ollama 服务地址
- API Key 保存到后端进行加密存储，前端不持久化 Key
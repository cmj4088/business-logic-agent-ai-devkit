# m17_agent_config/types.ts — Agent 配置模块类型定义

## 概述
定义 Agent 配置模块（M17）所需的类型，包括 LLM 后端类型、模型信息、Agent 配置状态、提示词模板、模型测试、Agent 角色元数据等数据结构，以及默认配置常量和角色元数据。

## 类型定义

### LLMBackend
- **功能**: LLM 后端类型
- **可选值**: `'ollama'` | `'anthropic'` | `'openai'`

### ModelInfo
- **功能**: 模型信息
- **字段**: `name` (string), `size?` (string), `modified_at?` (string), `digest?` (string)

### AgentConfig
- **功能**: Agent 配置状态
- **字段**: `defaultBackend`, `ollamaUrl`, `defaultModel`, `availableModels`, `temperature`, `maxTokens`, `anthropicApiKey`, `openaiApiKey`

### PromptTemplate
- **功能**: 提示词模板
- **字段**: `role` (AgentRole), `systemPrompt`, `userPromptTemplate`, `updatedAt?`, `version?`

### PromptPreviewRequest / PromptPreviewResponse
- **功能**: 提示词预览请求/响应
- **字段**: 请求含 `role`, `systemPrompt`, `projectContext?`, `stageContext?`；响应含 `renderedSystemPrompt`, `renderedUserPrompt`, `tokenCount`

### ModelTestRequest / ModelTestResponse
- **功能**: 模型测试请求/响应
- **字段**: 请求含 `backend`, `model?`, `ollamaUrl?`, `apiKey?`；响应含 `success`, `latencyMs`, `tokenCount`, `modelUsed`, `error?`

### AgentRoleMeta
- **功能**: Agent 角色元数据
- **字段**: `role` (AgentRole), `label` (string), `icon` (string emoji), `description` (string)

### 常量

| 常量名 | 说明 |
|--------|------|
| `AGENT_ROLE_META` | 6 个 Agent 角色的中文元数据（产品经理、研发架构师、测试专家、市场专家、制造工程师、财务分析师） |
| `DEFAULT_AGENT_CONFIG` | 默认配置：Ollama 后端、localhost:11434、qwen2.5 模型、temperature 0.7、maxTokens 32000 |
| `LLM_BACKEND_OPTIONS` | 3 个 LLM 后端选项（Ollama 推荐、Anthropic 云端、OpenAI 云端） |

## 依赖关系
- 导入 `AgentRole` from `@/shared/types`

## 注意事项
- `DEFAULT_AGENT_CONFIG` 中 API Key 默认为空字符串
- 云端后端选项标注了"数据将发送至境外服务器"的提醒
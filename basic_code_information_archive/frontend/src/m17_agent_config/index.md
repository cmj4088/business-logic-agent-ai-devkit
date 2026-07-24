# m17_agent_config/index.tsx — Agent 配置入口页面

## 概述
Agent 配置模块的入口页面，组合了 LLM 后端选择、Ollama 配置、模型测试、API Key 配置、Agent 角色列表/编辑/预览、高级参数等子组件。管理编辑和预览的切换状态。

## 组件详细说明

### AgentConfigPage (默认导出)
- **功能**: Agent 配置主页面
- **关键逻辑**:
  - 使用 `useAgentConfig` 和 `useModelTest` Hooks
  - `editingRole` / `previewingRole`: 控制编辑和预览面板的显示
  - `handleViewPrompt`: 进入编辑模式
  - `handleTestRole`: 测试当前角色（根据后端选择不同的 API Key）
  - `handleSavePrompt`: 保存提示词模板
  - `handlePreviewPrompt`: 进入预览模式
  - `handleOllamaTest`: 测试 Ollama 连接
  - 条件渲染：Ollama 后端时显示 OllamaConfig 和 ModelTestPanel
- **UI 结构** (从上到下):
  1. 页面标题 + 描述
  2. 保存消息 / 加载错误提示
  3. LLM 后端选择 (ModelSelector)
  4. Ollama 配置 (条件显示)
  5. 模型连接测试 (条件显示)
  6. 云端 API Key 配置 (ApiKeyConfig)
  7. Agent 角色列表 (AgentRoleList)
  8. Agent 角色编辑器 (条件显示)
  9. 提示词预览 (条件显示)
  10. 高级参数 (ModelParamsPanel)

## 导出项

| 导出名称 | 说明 |
|----------|------|
| `AgentConfigPage` (default) | Agent 配置页面 |
| `useAgentConfig` | Agent 配置 Hook |
| `useModelTest` | 模型测试 Hook |
| 各种类型 | AgentConfig, LLMBackend, ModelInfo, PromptTemplate 等 |

## 依赖关系
- `react`: useState, useCallback
- `@/shared/types`: AgentRole
- `./hooks/useAgentConfig`: useAgentConfig
- `./hooks/useModelTest`: useModelTest
- `./api`: updatePromptTemplate
- `./components/*`: 8 个子组件

## 注意事项
- 编辑和预览互斥，同一时间只能显示一个
- 云端 API Key 配置始终显示，不受后端选择影响
- 保存提示词后自动刷新模板列表
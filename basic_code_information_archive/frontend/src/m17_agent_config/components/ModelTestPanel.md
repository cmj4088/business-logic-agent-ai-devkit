# m17_agent_config/components/ModelTestPanel.tsx — 模型连接测试面板组件

## 概述
模型连接测试面板，独立于 ApiKeyConfig 使用（主要用于 Ollama 测试）。提供测试按钮、结果展示和清除结果功能。

## 组件详细说明

### ModelTestPanel({ backend, model, ollamaUrl, apiKey, disabled })
- **功能**: 模型测试面板 UI 组件
- **Props**: 
  - `backend` (LLMBackend) — 后端类型
  - `model?` (string) — 模型名称
  - `ollamaUrl?` (string) — Ollama 地址
  - `apiKey?` (string) — API Key
  - `disabled?` (boolean)
- **关键逻辑**:
  - Ollama 后端且无地址时显示"请先配置 Ollama 服务地址"
  - 测试中按钮显示旋转动画
  - 测试结果以卡片展示：成功/失败图标 + 延迟/Token 数/模型信息
- **UI 结构**: 测试按钮 + 清除结果按钮 + 测试结果卡片

## 依赖关系
- `../types`: LLMBackend
- `../hooks/useModelTest`: useModelTest

## 注意事项
- 与 `ApiKeyConfig` 中的测试功能使用相同的 `useModelTest` Hook
- 结果以 `dl` 定义列表展示，结构清晰
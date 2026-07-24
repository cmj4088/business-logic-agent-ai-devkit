# m17_agent_config/components/OllamaConfig.tsx — Ollama 连接配置组件

## 概述
Ollama 服务连接配置，包括服务地址输入、刷新模型列表按钮、可用模型列表展示和默认模型选择。

## 组件详细说明

### OllamaConfig({ ollamaUrl, defaultModel, availableModels, modelsLoading, onUrlChange, onModelChange, onRefreshModels, disabled })
- **功能**: Ollama 配置 UI 组件
- **Props**:
  - `ollamaUrl` (string) — 当前 Ollama 地址
  - `defaultModel` (string) — 默认模型
  - `availableModels` (ModelInfo[]) — 可用模型列表
  - `modelsLoading` (boolean) — 模型加载中
  - `onUrlChange` — 地址变更回调
  - `onModelChange` — 模型变更回调
  - `onRefreshModels` — 刷新模型列表回调
  - `disabled?` (boolean)
- **关键逻辑**:
  - 地址输入使用 `localUrl` 本地状态，失焦或回车时提交变更
  - 加载中时刷新按钮显示旋转动画
  - 模型列表以标签形式展示，默认模型高亮（indigo 边框）
  - 模型选择下拉框仅在模型列表非空时可用
- **UI 结构**: 白色卡片，地址输入 + 刷新按钮，模型标签列表，默认模型下拉框

## 依赖关系
- `react`: useState, useCallback
- `../types`: ModelInfo

## 注意事项
- 地址变更使用 `onBlur` 和 `onKeyDown(Enter)` 提交，避免每次输入都触发 API 调用
- 模型标签显示 `model.size` 信息（如 "4.7GB"）
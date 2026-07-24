# m17_agent_config/components/ModelSelector.tsx — 模型选择器组件

## 概述
LLM 后端选择器，以单选卡片形式展示 3 个后端选项（Ollama 推荐、Anthropic 云端、OpenAI 云端）。Ollama 标注"推荐"标签，云端后端标注"云端"标签。

## 组件详细说明

### ModelSelector({ value, onChange, disabled })
- **功能**: LLM 后端选择器 UI 组件
- **Props**: 
  - `value` (LLMBackend) — 当前选中的后端
  - `onChange` (function) — 选择变更回调
  - `disabled?` (boolean)
- **关键逻辑**:
  - Ollama 选项显示绿色"推荐"标签
  - Anthropic 和 OpenAI 选项显示琥珀色"云端"标签
  - 选中状态：indigo 边框 + indigo 背景
  - 使用 `fieldset` + `disabled` 实现整体禁用
- **UI 结构**: 白色卡片，3 个单选卡片项

## 依赖关系
- `../types`: LLMBackend, LLM_BACKEND_OPTIONS

## 注意事项
- 使用原生 `radio` input，但通过 `sr-only` 隐藏，用 label 样式模拟
- 禁用时 `opacity-60` 和 `cursor-not-allowed`
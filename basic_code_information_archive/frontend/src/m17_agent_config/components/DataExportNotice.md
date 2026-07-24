# m17_agent_config/components/DataExportNotice.tsx — 数据出境告知弹窗组件

## 概述
使用云端 API 前的数据出境告知弹窗，使用原生 `<dialog>` 元素实现模态框。展示数据发送目的地、用途、涉及的数据类型，要求用户勾选同意后才能继续。

## 组件详细说明

### DATA_EXPORT_INFO
- **功能**: Anthropic 和 OpenAI 的数据出境信息
- **字段**: `destination`, `company`, `dataTypes`, `purpose`

### DataExportNotice({ isOpen, backend, onAgree, onDisagree, onClose })
- **功能**: 数据出境告知弹窗 UI 组件
- **Props**: 
  - `isOpen` (boolean) — 是否打开
  - `backend` ('anthropic' | 'openai') — 后端类型
  - `onAgree` (function) — 同意回调
  - `onDisagree` (function) — 不同意回调
  - `onClose` (function) — 关闭回调
- **状态管理**: `checked` (是否勾选同意)
- **关键逻辑**:
  - 使用原生 `<dialog>` 元素和 `showModal()`/`close()` 方法
  - ESC 关闭时：未勾选同意视为不同意，调用 `onDisagree`
  - 同意按钮仅在勾选后可用
  - 显示数据目的地（美国）、用途、数据类型列表
- **UI 结构**: 模态对话框，警告图标 + 标题 + 详情卡片 + 警告文字 + 同意勾选 + 同意/不同意按钮

## 依赖关系
- `react`: useState, useCallback, useEffect, useRef

## 注意事项
- 使用原生 `<dialog>` 而非自定义 div 模态框，利用浏览器内置的焦点管理和 ESC 关闭
- `isOpen` 为 false 时返回 null（不渲染）
- 对话框关闭时同时调用 `onClose` 和 `onDisagree`（如未同意）
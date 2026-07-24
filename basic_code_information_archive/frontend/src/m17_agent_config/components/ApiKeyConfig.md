# m17_agent_config/components/ApiKeyConfig.tsx — API Key 配置面板组件

## 概述
云端 API Key 管理面板，支持 Anthropic 和 OpenAI 的 API Key 输入、显示/隐藏切换、测试连接。使用云端 API 前需要同意数据出境告知。

## 组件详细说明

### ApiKeyConfig({ anthropicApiKey, openaiApiKey, defaultBackend, onAnthropicKeyChange, onOpenaiKeyChange, disabled })
- **功能**: API Key 配置 UI 组件
- **Props**: API Key 值和变更回调，当前后端，禁用状态
- **状态管理**: `showAnthropic`, `showOpenai` (显示/隐藏), `pendingBackend`, `pendingAction` (数据出境确认), `showDataNotice`
- **关键逻辑**:
  - `handleTest`: 点击测试按钮时，先设置 `pendingBackend` 和 `pendingAction`，弹出数据出境告知
  - `handleDataNoticeAgree`: 用户同意后执行测试
  - `handleDataNoticeDisagree`: 用户不同意时取消操作
  - `maskApiKey`: 掩码显示 API Key（保留首尾 4 位，中间用 `•` 替换）
  - 显示/隐藏按钮使用眼睛图标切换
  - 测试结果显示连接状态、延迟、Token 数、模型名称
- **UI 结构**: 白色卡片，两个 API Key 输入行（含显示/隐藏 + 测试按钮），测试结果区，数据出境提醒，数据出境告知弹窗

## 依赖关系
- `react`: useState, useCallback
- `../types`: LLMBackend
- `./DataExportNotice`: DataExportNotice
- `../hooks/useModelTest`: useModelTest

## 注意事项
- 数据出境告知弹窗仅在用户点击"测试"按钮时触发
- 当前后端非云端时显示"未启用"标签
- API Key 掩码逻辑：长度 <= 8 时全部掩码
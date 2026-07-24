# m16_artifact_editor/components/RegenerateButton.tsx — 重新生成按钮组件

## 概述
重新生成产出物的按钮，点击后弹出对话框输入原因和额外指令，调用 M10 异常恢复 API 重新生成产出物内容。

## 组件详细说明

### RegenerateButton({ artifactId, artifactName, onRegenerated })
- **功能**: 重新生成按钮 UI 组件
- **Props**: 
  - `artifactId` (string) — 产出物 ID
  - `artifactName` (string) — 产出物名称（对话框显示用）
  - `onRegenerated` (function) — 重新生成成功回调
- **状态管理**: `showDialog`, `reason` (重新生成原因), `instructions` (额外指令), `isRegenerating`, `error`
- **关键逻辑**:
  - 点击按钮弹出对话框
  - 重新生成原因为必填
  - 额外指令为可选
  - 调用 `regenerateArtifactAPI` 后回调 `onRegenerated`
  - 对话框提示"当前版本将被保留，新内容将创建为新版本"
- **UI 结构**: 触发按钮 + 模态对话框（原因输入 + 指令输入 + 确认/取消）

## 依赖关系
- `react`: useState, useCallback
- `../types`: RegenerateResponse
- `../api`: regenerateArtifactAPI

## 注意事项
- 使用 `fixed inset-0` 全屏遮罩模态框
- 重新生成中按钮禁用并显示"生成中..."
- 成功/失败后对话框自动关闭
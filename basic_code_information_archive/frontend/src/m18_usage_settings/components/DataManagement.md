# m18_usage_settings/components/DataManagement.tsx — 数据管理组件

## 概述
数据管理面板，提供导出所有项目数据（JSON 格式）和清除所有数据的功能。清除操作需要用户输入 "DELETE" 确认，防止误操作。

## 组件详细说明

### DataManagement({ onExport, onClear })
- **功能**: 数据管理 UI 组件
- **Props**: 
  - `onExport` (function) — 导出回调，返回 Promise<boolean>
  - `onClear` (function) — 清除回调，接收确认字符串，返回 Promise<boolean>
- **状态管理**: `showClearDialog`, `clearInput`, `isExporting`, `isClearing`, `message`
- **关键逻辑**:
  - `handleExport`: 调用导出，显示成功/失败消息
  - `handleClear`: 验证输入是否为 "DELETE"，调用清除 API
  - 清除确认对话框：全屏遮罩，输入框自动聚焦，按钮在输入不为 "DELETE" 时禁用
  - 提示"清除所有数据不可恢复，请先导出备份"
- **UI 结构**: 标题 + 导出/清除按钮 + 提示文字 + 消息 + 清除确认对话框

## 依赖关系
- `react`: React, useState

## 注意事项
- 清除操作需要精确输入 "DELETE"（大写），区分大小写
- 清除确认对话框使用 `fixed inset-0` 全屏遮罩
- 输入框使用 `autoFocus` 自动聚焦
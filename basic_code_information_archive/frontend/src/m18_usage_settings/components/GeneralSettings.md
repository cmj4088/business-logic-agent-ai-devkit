# m18_usage_settings/components/GeneralSettings.tsx — 全局设置组件

## 概述
全局设置面板，配置界面语言（简体中文/English）、主题（浅色/深色/跟随系统）和通知偏好（门禁就绪/阶段完成/预算偏差）。

## 组件详细说明

### LANGUAGES / THEMES
- **功能**: 语言和主题选项列表

### GeneralSettings({ settings, onSave, isSaving })
- **功能**: 全局设置 UI 组件
- **Props**: 
  - `settings` (GlobalSettings) — 当前设置
  - `onSave` (function) — 保存回调
  - `isSaving` (boolean) — 保存中状态
- **状态管理**: `language`, `theme`, `notifications`, `message`
- **关键逻辑**:
  - 界面语言：下拉选择框
  - 主题：radio 按钮组
  - 通知偏好：3 个复选框（门禁就绪/阶段完成/预算偏差）
  - `handleNotificationToggle`: 切换单个通知偏好
  - 保存后显示成功/失败消息
- **UI 结构**: 标题 + 语言选择 + 主题选择 + 通知偏好 + 保存按钮 + 消息

## 依赖关系
- `react`: React, useState, useEffect
- `../types`: GlobalSettings, NotificationPreferences

## 注意事项
- 主题设置目前仅做 UI 配置，实际主题切换未实现（MVP 阶段）
- 语言设置同理，MVP 阶段仅做配置存储
# m18_usage_settings/hooks/useSettings.ts — 设置数据 Hook

## 概述
管理全局设置的获取和更新，以及数据导出和清除操作。导出功能通过创建 Blob URL 触发浏览器下载，清除功能需传入确认字符串。

## Hook 详细说明

### useSettings()
- **功能**: 管理全局设置数据
- **返回值**: `SettingsState & { refresh, saveSettings, exportData, clearAllData }`
- **关键逻辑**:
  - `saveSettings`: 更新全局设置，保存中 `isSaving` 为 true
  - `exportData`: 调用 API 获取 Blob，创建临时 `<a>` 标签触发下载，文件名格式 `ipd-export-YYYY-MM-DD.json`
  - `clearAllData`: 传入确认字符串调用 API，返回 boolean
  - 所有操作返回 boolean 表示成功/失败

## 依赖关系
- `react`: useState, useEffect, useCallback
- `../types`: GlobalSettings, SettingsState
- `../api`: fetchSettingsAPI, updateSettingsAPI, exportDataAPI, clearDataAPI

## 注意事项
- `exportData` 使用 `window.URL.createObjectURL` + 临时 `<a>` 标签方式触发下载
- 下载完成后需要 `revokeObjectURL` 释放内存
- `clearAllData` 需要确认字符串（如 "DELETE"），防止误操作
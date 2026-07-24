# updater.ts — 自动更新模块

## 概述
该文件使用 `electron-updater` 实现应用的自动更新功能。支持从 GitHub Releases 或自定义更新服务器获取更新，下载完成后提示用户重启安装。开发环境下自动更新不启用，所有更新事件通过 IPC 推送给渲染进程。

## 全局状态

### autoDownload
- **类型**: `boolean`，默认 `true`
- **用途**: 控制是否自动下载更新

### windowRef
- **类型**: `BrowserWindow | null`
- **用途**: 主窗口引用，用于向渲染进程推送更新事件和显示对话框

## 导出函数

### setUpdaterWindowRef(win)
- **功能**: 设置窗口引用
- **参数**: `win: BrowserWindow` — 主窗口实例

### initializeUpdater()
- **功能**: 配置并初始化自动更新器
- **关键逻辑**:
  - 开发环境（`!app.isPackaged`）：直接返回，不启用更新
  - 生产环境：配置 `autoUpdater` 并注册以下事件监听器：

#### 事件监听器

| 事件 | 触发时机 | 行为 |
|------|----------|------|
| `checking-for-update` | 开始检查更新 | 打印日志 |
| `update-available` | 发现新版本 | 通过 IPC 推送 `update:available` 给渲染进程 |
| `update-not-available` | 当前已是最新 | 打印日志 |
| `download-progress` | 下载进行中 | 通过 IPC 推送 `update:download-progress`（含百分比） |
| `update-downloaded` | 下载完成 | 弹出对话框询问用户是否立即重启安装 |
| `error` | 更新出错 | 通过 IPC 推送 `update:error` |

### checkForUpdates()
- **功能**: 手动检查更新
- **返回值**: `Promise<UpdateInfo | null>` — 更新信息或 null
- **关键逻辑**:
  - 开发环境直接返回 null
  - 调用 `autoUpdater.checkForUpdates()` 并提取 `updateInfo`

### setAutoDownload(enabled)
- **功能**: 设置是否自动下载更新
- **参数**: `enabled: boolean`

### scheduleUpdateCheck(delayMs)
- **功能**: 启动后延迟自动检查更新
- **参数**: `delayMs: number`，默认 5000ms（5 秒）
- **关键逻辑**: 开发环境跳过，使用 `setTimeout` 延迟执行

## 更新流程

1. **启动**: 应用启动 5 秒后自动检查更新
2. **发现更新**: 通过 IPC 通知渲染进程
3. **下载**: 自动下载（可配置），进度实时推送
4. **下载完成**: 弹出原生对话框询问用户
   - "立即重启"：调用 `autoUpdater.quitAndInstall()` 重启安装
   - "稍后提醒"：关闭对话框，不安装
5. **错误处理**: 通过 IPC 将错误信息发送给渲染进程

## 依赖关系
- `electron-updater` — `autoUpdater`, `UpdateInfo`, `ProgressInfo`
- `electron` — `BrowserWindow`, `dialog`, `app`

## 注意事项
- 开发环境不启用自动更新，通过 `app.isPackaged` 判断
- 需要正确配置 `electron-builder` 的 `publish` 字段才能正常获取更新
- 更新源默认为 GitHub Releases，可在 `electron-builder` 配置中修改
- 代码签名是 macOS 自动更新的必要条件
- 下载完成后用户可以选择不立即重启，应用会继续正常运行
- 所有更新事件通过 IPC 单向推送（主进程 → 渲染进程），渲染进程通过 `preload.ts` 中的监听器接收
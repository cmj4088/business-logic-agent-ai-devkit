# preload.ts — Preload 安全桥接脚本

## 概述
该文件是 Electron 的 **preload 脚本**，在主进程和渲染进程之间建立安全桥梁。使用 `contextBridge` 向渲染进程暴露有限的、安全的 API，严格遵循 Electron 安全最佳实践：禁止直接暴露 Node.js API，只允许通过 `ipcRenderer.invoke`（请求-响应模式）进行通信。

## 暴露的 API 详细说明

`window.electronAPI` 是渲染进程中唯一可以访问 Electron 功能的入口，所有方法按功能分组如下：

### 安全存储（3 个方法）

#### getSecure(key)
- **功能**: 读取安全存储中的值
- **参数**: `key: string` — 存储键名
- **返回值**: `Promise<string | undefined>` — 存储的值，不存在则返回 undefined
- **IPC 通道**: `store:get`

#### setSecure(key, value)
- **功能**: 写入安全存储（敏感字段自动加密）
- **参数**:
  - `key: string` — 存储键名
  - `value: string` — 要存储的值
- **返回值**: `Promise<boolean>`
- **IPC 通道**: `store:set`

#### deleteSecure(key)
- **功能**: 删除安全存储中的值
- **参数**: `key: string` — 存储键名
- **返回值**: `Promise<boolean>`
- **IPC 通道**: `store:delete`

### 系统通知（1 个方法）

#### showNotification(title, body)
- **功能**: 显示系统原生通知
- **参数**:
  - `title: string` — 通知标题
  - `body: string` — 通知正文
- **返回值**: `Promise<boolean>`
- **IPC 通道**: `notification:show`

### 文件对话框（1 个方法）

#### openFileDialog(options)
- **功能**: 打开文件选择对话框
- **参数**: `options: { filters: { name: string; extensions: string[] }[] }` — 文件类型过滤器
- **返回值**: `Promise<{ canceled: boolean; filePaths: string[] }>`
- **IPC 通道**: `dialog:openFile`

### 应用信息（2 个方法）

#### getAppVersion()
- **功能**: 获取应用版本号
- **返回值**: `Promise<string>`
- **IPC 通道**: `app:version`

#### getPlatform()
- **功能**: 获取当前平台标识（如 `'win32'`、`'darwin'`、`'linux'`）
- **返回值**: `NodeJS.Platform`
- **注意**: 这是唯一一个同步暴露的方法，只暴露了平台字符串，不暴露其他 Node.js 信息

### 窗口控制（4 个方法）

#### minimizeWindow()
- **功能**: 最小化窗口
- **返回值**: `Promise<boolean>`
- **IPC 通道**: `window:minimize`

#### maximizeWindow()
- **功能**: 最大化/还原窗口（切换）
- **返回值**: `Promise<boolean>`
- **IPC 通道**: `window:maximize`

#### closeWindow()
- **功能**: 关闭窗口
- **返回值**: `Promise<boolean>`
- **IPC 通道**: `window:close`

#### isMaximized()
- **功能**: 检查窗口是否处于最大化状态
- **返回值**: `Promise<boolean>`
- **IPC 通道**: `window:isMaximized`

### 服务器配置（1 个方法）

#### getServerUrl()
- **功能**: 获取远程服务器地址（客户端模式下返回构建时配置的服务器 URL）
- **返回值**: `Promise<string>` — 服务器 URL，非客户端模式返回空字符串
- **IPC 通道**: `server:get-url`
- **IPC 通道**: `server:get-url`

### 更新事件监听（4 个方法）

#### onUpdateAvailable(callback)
- **功能**: 监听更新可用事件
- **参数**: `callback: (info: unknown) => void` — 收到更新信息时的回调
- **注意**: 使用 `ipcRenderer.on` 但仅用于单向推送，是安全的

#### onUpdateDownloadProgress(callback)
- **功能**: 监听更新下载进度
- **参数**: `callback: (progress: unknown) => void` — 下载进度回调

#### onUpdateError(callback)
- **功能**: 监听更新错误
- **参数**: `callback: (error: { message: string }) => void` — 错误回调

#### removeUpdateListeners()
- **功能**: 移除所有更新事件监听器，防止内存泄漏

## 安全规则

1. **只能使用 `ipcRenderer.invoke`**: 请求-响应模式，主进程完全控制可以执行什么操作
2. **禁止使用 `ipcRenderer.send/on`**: 推送模式权限过大，更新事件监听是唯一例外且仅限推送
3. **禁止暴露 Node.js API**: 如 `fs`、`path`、`child_process` 等
4. **禁止暴露 `ipcRenderer` 本身**: 渲染进程无法直接操作 IPC

## 依赖关系
- `electron` — `contextBridge`, `ipcRenderer`

## 注意事项
- 渲染进程只能通过 `window.electronAPI` 访问这些功能，不能直接访问 `require` 或 Node.js API
- 所有方法（除 `getPlatform` 和事件监听器）都是异步的，返回 Promise
- 更新事件监听器使用后应调用 `removeUpdateListeners` 清理，避免内存泄漏
- 如果需要在 preload 中新增 API，必须确保不破坏安全规则
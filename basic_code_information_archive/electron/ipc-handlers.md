# ipc-handlers.ts — IPC 处理器注册模块

## 概述
该文件负责将所有 **IPC（进程间通信）处理器**注册到主进程的 `ipcMain` 上。每个 handler 处理一个特定的 IPC channel，处理来自渲染进程（通过 preload 桥接）的请求。采用严格的输入校验和安全设计，确保渲染进程无法执行危险操作。

## 全局状态

### windowRef
- **类型**: `BrowserWindow | null`
- **用途**: 保存主窗口引用，供文件对话框和窗口控制等需要窗口引用的操作使用
- **设置**: 由 `setWindowRef()` 在 `main.ts` 创建窗口后调用

## 导出函数详细说明

### setWindowRef(win)
- **功能**: 设置窗口引用
- **参数**: `win: BrowserWindow` — 主窗口实例

### registerIpcHandlers()
- **功能**: 注册所有 IPC 处理器到 `ipcMain`
- **关键逻辑**: 按功能分组注册以下处理器：

#### 安全存储（3 个通道）
| 通道 | 功能 | 校验 |
|------|------|------|
| `store:get` | 读取安全存储 | key 非空字符串 |
| `store:set` | 写入安全存储 | key、value 非空字符串 |
| `store:delete` | 删除安全存储 | key 非空字符串 |

#### 系统通知（1 个通道）
| 通道 | 功能 | 校验 |
|------|------|------|
| `notification:show` | 显示系统通知 | title、body 非空字符串 |

- 先检查 `Notification.isSupported()` 是否可用
- 创建 `Notification` 实例并调用 `show()`

#### 文件对话框（1 个通道）
| 通道 | 功能 | 校验 |
|------|------|------|
| `dialog:openFile` | 打开文件选择对话框 | 检查 windowRef 已初始化 |

- 使用 `dialog.showOpenDialog` 打开原生文件对话框
- 默认属性为 `openFile`（选择文件）
- 返回 `{ canceled, filePaths }` 结构

#### 应用信息（1 个通道）
| 通道 | 功能 |
|------|------|
| `app:version` | 获取应用版本号 |

- 直接调用 `app.getVersion()`

#### 窗口控制（4 个通道）
| 通道 | 功能 | 说明 |
|------|------|------|
| `window:minimize` | 最小化窗口 | |
| `window:maximize` | 最大化/还原窗口 | 切换操作 |
| `window:close` | 关闭窗口 | |
| `window:isMaximized` | 检查是否最大化 | 返回 boolean |

#### 服务器配置（1 个通道）
| 通道 | 功能 | 说明 |
|------|------|------|
| `server:get-url` | 获取远程服务器 URL | 客户端模式返回构建时配置的地址 |

- `setServerUrl(url)`: 由 main.ts 在客户端模式启动时调用，设置服务器地址

### unregisterIpcHandlers()
- **功能**: 注销所有 IPC 处理器（应用退出时调用）
- **关键逻辑**: 遍历所有已注册的 channel 名称，调用 `ipcMain.removeHandler()` 逐一移除

### validateStringArg(value, name)（内部函数）
- **功能**: 校验输入参数是否为非空字符串
- **参数**:
  - `value: unknown` — 待校验的值
  - `name: string` — 参数名称（用于错误消息）
- **抛出**: 如果不是非空字符串，抛出 `Error`
- **类型守卫**: 使用 TypeScript `asserts` 语法，校验通过后类型收窄为 `string`

## 安全设计

1. **所有 handler 使用 `ipcMain.handle`**: 异步请求-响应模式，主进程完全控制
2. **不使用 `ipcMain.on`**: 避免渲染进程通过推送模式获得过大权限
3. **所有输入参数经过校验**: `validateStringArg` 确保参数非空且类型正确
4. **文件对话框通过主进程打开**: 渲染进程无法直接访问文件系统

## 依赖关系
- `electron` — `ipcMain`, `dialog`, `Notification`, `app`, `BrowserWindow`, `OpenDialogOptions`
- `./store` — `setSecureValue`, `getSecureValue`, `deleteSecureValue`

## 注意事项
- 必须在 `main.ts` 创建窗口后调用 `setWindowRef()`，否则文件对话框等功能无法正常工作
- 应用退出时必须调用 `unregisterIpcHandlers()` 清理，避免内存泄漏
- 新增 IPC 通道时，需要同时在 `registerIpcHandlers` 和 `unregisterIpcHandlers` 中添加
- 所有输入参数都应经过校验，不可信任来自渲染进程的数据
# Electron 壳 — CLAUDE.md

> **模块编号**：E0
> **模块名称**：Electron 桌面壳
> **负责 Agent**：全栈开发（后端 A/B 支援）
> **上游依赖**：M0（健康检查端点）
> **下游被依赖**：所有前端模块（提供窗口环境、secureStore、IPC 通信）
> **参考文档**：`docs/mvp-guide-v2.md` §二、`docs/security-architecture-v2.md`

---

## 输入依赖

| 依赖 | 来源 | 用途 |
|------|------|------|
| 健康检查端点 | M0（`GET /api/health`） | 启动时轮询等待 Python 后端就绪 |
| 认证 API | M1（`POST /api/auth/login`） | Token 安全存储到 electron-store |

---

## 输出接口

| 接口 | 类型 | 说明 |
|------|------|------|
| `electronAPI` | preload 暴露 | 安全存储、系统通知、文件对话框、窗口控制 |
| 窗口生命周期 | 主进程 | 启动 Python 后端 → 加载前端 → 退出清理 |
| IPC 通道 | 主进程 ↔ 渲染进程 | store:get/set/delete、notification:show、dialog:openFile 等 |

---

## 职责范围

Electron 壳负责：
1. **应用生命周期**：启动 Python 后端子进程 → 加载前端 → 窗口管理 → 退出清理
2. **安全隔离**：主进程 / preload / 渲染进程三层隔离
3. **原生能力**：系统通知、文件对话框、快捷键、自动更新
4. **安全存储**：Token/API Key 的加密存储（electron-store + safeStorage）
5. **进程通信**：IPC 通道定义和安全校验

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `electron/main.ts` | 主进程入口：窗口创建、子进程管理、IPC 注册 |
| `electron/preload.ts` | preload 脚本：contextBridge 暴露安全 API |
| `electron/ipc-handlers.ts` | IPC 处理器注册 |
| `electron/python-bridge.ts` | Python 后端子进程管理（启动/健康检查/关闭） |
| `electron/store.ts` | 安全存储（Token、API Key 等） |
| `electron/updater.ts` | 自动更新逻辑 |

---

## 安全配置（必须）

### BrowserWindow 配置
```typescript
// electron/main.ts
const mainWindow = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,        // 禁止渲染进程访问 Node.js
    contextIsolation: true,        // 隔离 preload 和渲染进程
    sandbox: true,                 // 沙箱模式
    webSecurity: true,             // 启用 Web 安全策略
    allowRunningInsecureContent: false, // 禁止不安全内容
    webviewTag: false,             // 禁用 webview 标签
    preload: path.join(__dirname, 'preload.js'),
  },
});
```

### CSP 头（必须设置）
```typescript
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:* ws://localhost:*;"
      ],
    },
  });
});
```

---

## Python 后端子进程管理

### 启动流程
```
1. 检测 Python 环境（PyInstaller 打包后使用内置 Python）
2. 启动 FastAPI 子进程（uvicorn）
3. 轮询 GET /api/health 等待就绪（最多 30 秒）
4. 就绪后加载前端页面
5. 监听子进程 stdout/stderr
```

### 关闭流程
```
1. 发送 SIGTERM 给 Python 子进程
2. 等待 5 秒优雅关闭
3. 超时则 SIGKILL
4. 清理临时文件
```

### 崩溃恢复
- Python 子进程异常退出 → 自动重启（最多 3 次）
- 3 次重启失败 → 显示错误页，提供"查看日志"和"联系支持"按钮

---

## preload API（contextBridge 暴露）

```typescript
// 仅暴露以下安全 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 安全存储
  getSecure: (key: string) => ipcRenderer.invoke('store:get', key),
  setSecure: (key: string, value: string) => ipcRenderer.invoke('store:set', key, value),
  deleteSecure: (key: string) => ipcRenderer.invoke('store:delete', key),

  // 系统通知
  showNotification: (title: string, body: string) => ipcRenderer.invoke('notification:show', title, body),

  // 文件对话框
  openFileDialog: (options: { filters: { name: string, extensions: string[] }[] }) => ipcRenderer.invoke('dialog:openFile', options),

  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => process.platform,

  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
});
```

---

## 开发环境 vs 生产环境

| 环境 | 前端加载 | Python 后端 | DevTools |
|------|---------|------------|----------|
| 开发 | `http://localhost:5173`（Vite dev server） | 独立启动 `uvicorn main:app` | 开启 |
| 生产 | `file://` 加载打包后的 dist | PyInstaller 子进程 | 关闭 |

---

## 完成标准

- [ ] 应用窗口正常创建（最小尺寸 1024x768）
- [ ] Python 子进程启动成功，健康检查轮询就绪（30 秒内）
- [ ] CSP 头正确设置（default-src 'self'）
- [ ] contextIsolation=true, nodeIntegration=false, sandbox=true 生效
- [ ] preload API（store/get/set/delete、notification、dialog、window）全部可用
- [ ] Token/API Key 通过 electron-store + safeStorage 加密存储
- [ ] 窗口关闭时 Python 子进程优雅退出（5 秒超时 → SIGKILL）
- [ ] Python 子进程崩溃后自动重启（最多 3 次）
- [ ] 生产环境 DevTools 关闭

---

## 禁止事项

1. **禁止在 preload 中暴露 ipcRenderer.send/on**（只能用 invoke/handle 模式）
2. **禁止在渲染进程中启用 nodeIntegration**
3. **禁止加载外部 URL**（CSP default-src 'self'）
4. **禁止在 main.ts 中硬编码端口号**（使用动态端口检测）
5. **禁止在生产环境开启 DevTools**
6. **禁止在 preload 中暴露 Node.js API**（如 fs、path、child_process）

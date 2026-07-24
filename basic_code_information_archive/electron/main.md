# Electron 主进程 代码说明

## 概述
该文件是 Electron 应用的**主进程入口**，负责整个应用的生命周期管理。它协调了窗口创建、安全策略设置、Python 后端启动（正常模式）/远程服务器连接（客户端模式）、IPC 通信注册、自动更新和资源清理等核心功能。

## 文件: main.ts
- **路径**: `electron/main.ts`
- **作用**: Electron 主进程入口，支持两种运行模式：
  - **正常模式**（默认）：启动本地 Python 后端 → 加载前端
  - **客户端模式**（通过 app-config.json）：连接远程 BLA 服务器 → 加载远程页面，不启动本地后端
- **关键函数/类**:
  - `loadAppConfig()`: 读取 app-config.json，获取服务器配置（客户端模式下由 build-exe.bat 生成）
  - `createMainWindow()`: 创建并配置 Electron 主窗口，设置安全隔离配置
  - `setupCSP()`: 设置 Content-Security-Policy，客户端模式下动态添加远程服务器域名
  - `setupMenu()`: 设置应用菜单（客户端模式下标题显示"BLA 评委端"）
  - `loadFrontend()`: 加载前端页面（正常模式→本地文件；客户端模式→远程URL）
  - `setupPythonBridgeListeners(bridge)`: 设置 Python 子进程事件监听（仅正常模式）
  - `showErrorPage(message, showActions)`: 显示内联错误页面
  - `getIconPath()`: 获取应用图标路径
- **新增常量/变量**:
  - `SERVER_URL`: 从 app-config.json 读取的远程服务器地址
  - `IS_CLIENT_MODE`: 是否处于客户端模式（!!SERVER_URL）
- **依赖关系**:
  - 引入: `electron`, `path`, `fs`, `./python-bridge`, `./ipc-handlers`, `./updater`
  - 被引用: Electron 主进程 `package.json` 的 `main` 字段
- **最后修改**: 2026-07-24
- **修改原因**: 新增客户端模式，支持远程服务器连接

## 运行模式对比

| 特性 | 正常模式 | 客户端模式 |
|------|---------|-----------|
| Python 后端 | 启动本地后端 | 不启动 |
| 前端来源 | 本地 dist 文件 | 远程服务器 URL |
| 适用场景 | 开发/自用 | 比赛评委使用 |
| 配置方式 | 无需配置 | app-config.json |

## 注意事项
- 安全配置必须严格遵守
- 生产环境下所有 DevTools 入口被禁用
- 客户端模式下 Electron 仅为"浏览器壳"，所有业务逻辑在远程服务器上

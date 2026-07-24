# vite.config.ts — Vite 构建配置

## 概述
Vite 构建工具的配置文件，用于前端项目的开发和构建。配置了 React 插件、路径别名、开发服务器端口和代理规则。

## 配置项详细说明

### plugins
- **功能**: 启用 `@vitejs/plugin-react` 插件，支持 React JSX 转换和 Fast Refresh

### resolve.alias
- **功能**: 路径别名配置
- **`@`**: 映射到 `./src` 目录，方便模块导入
- **`@shared`**: 映射到 `./src/shared` 目录

### server.port
- **功能**: 开发服务器端口，默认 5173

### server.host
- **功能**: 开发服务器监听地址
- **值**: `true`（等效于 `0.0.0.0`），允许局域网内其他设备访问 Vite 开发服务器

### server.proxy
- **功能**: 开发环境 API 代理配置
- **`/api`**: 代理到 `http://localhost:8000`（后端 FastAPI 服务）
- **`/ws`**: WebSocket 代理到 `ws://localhost:8000`，启用 WebSocket 支持

## 依赖关系
- `vite`: defineConfig
- `@vitejs/plugin-react`: react 插件
- `path`: Node.js 路径模块

## 注意事项
- `changeOrigin: true` 确保代理请求头中的 Host 正确
- WebSocket 代理需要单独配置 `ws: true`
- 路径别名 `@` 和 `@shared` 需要在 `tsconfig.json` 中同步配置
- `host: true` 使 Vite 监听所有网络接口，允许局域网内其他设备通过 `http://本机IP:5173` 访问
- 生产模式下不需要 Vite 开发服务器，后端直接托管构建后的静态文件
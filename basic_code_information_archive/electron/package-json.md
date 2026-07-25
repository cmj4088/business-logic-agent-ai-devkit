# Electron package.json — 构建配置

## 文件: package.json
- **路径**: `electron/package.json`
- **作用**: Electron 应用的包配置和 electron-builder 构建配置
- **应用名称**: BLA（productName）
- **版本**: 1.0.0

## 构建配置详解

### extraResources（打包外部资源）
```json
[
  {"from": "app-config.json", "to": "app-config.json"},
  {"from": "../frontend/dist", "to": "frontend/dist"}
]
```
- `app-config.json`: 构建时生成的服务器地址配置（由 build-exe.bat 写入）
- `frontend/dist`: 前端构建产物（React SPA），打包到 `resources/frontend/dist/` 目录
- **用途**: Electron 客户端模式下通过 `process.resourcesPath + '/frontend/dist/index.html'` 加载本地前端文件
- **添加时间**: 2026-07-25（修复闪退问题）

### NSIS 安装程序配置
- oneClick: false（向导式安装）
- perMachine: false（仅当前用户）
- allowToChangeInstallationDirectory: true（允许自定义安装路径）
- createDesktopShortcut: true（创建桌面快捷方式）
- shortcutName: "BLA"

## 依赖关系
- devDependencies: electron ^28.0.0, electron-builder ^24.13.3, typescript ^5.3.0
- dependencies: electron-store ^8.1.0, electron-updater ^6.1.0

## 注意事项
- app-config.json 由 build-exe.bat 在构建时创建，构建完成后自动删除
- frontend/dist 需要在构建前已存在（由 build-exe.bat 的 `npm run build` 生成）
- 当构建到临时目录时（避免文件锁定），需通过 `-c.directories.output=<temp_dir>` 参数

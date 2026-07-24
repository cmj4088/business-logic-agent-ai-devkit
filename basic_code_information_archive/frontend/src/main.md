# main.tsx — 应用入口文件

## 概述
React 应用的入口文件，负责挂载根组件到 DOM。使用 React 18 的 `createRoot` API 进行渲染，并启用 `StrictMode` 严格模式。

## 组件/函数详细说明

### ReactDOM.createRoot
- **功能**: 创建 React 18 并发渲染根节点
- **关键逻辑**: 
  - 通过 `document.getElementById('root')` 获取挂载点
  - 使用 `React.StrictMode` 包裹 App 组件，启用开发模式下的额外检查（如重复渲染、副作用检测）
  - 导入全局样式 `./index.css`

## 依赖关系
- `react`: React 核心库
- `react-dom/client`: React 18 客户端渲染 API
- `./App`: 根组件
- `./index.css`: 全局样式（Tailwind CSS）

## 注意事项
- `getElementById('root')!` 使用了非空断言，确保 HTML 中存在 `#root` 元素
- `StrictMode` 只影响开发环境，生产环境不生效
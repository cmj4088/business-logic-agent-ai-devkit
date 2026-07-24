# m18_usage_settings/components/AboutPage.tsx — 关于页面组件

## 概述
关于页面，展示 Business Logic Agent 的版本信息、技术栈标签和第三方开源依赖列表。

## 组件详细说明

### Dependency (接口)
- **功能**: 第三方依赖信息
- **字段**: `name`, `version`, `license`

### DEPENDENCIES
- **功能**: 10 个主要依赖列表
- **值**: React(18.3/MIT), React Router(6.26/MIT), Axios(1.7/MIT), Tailwind CSS(3.4/MIT), FastAPI(0.115/MIT), SQLAlchemy(2.0/MIT), SQLite(3.x/Public Domain), Electron(33/MIT), Vite(5.4/MIT), TypeScript(5.5/Apache-2.0)

### AboutPage()
- **功能**: 关于页面 UI 组件
- **UI 结构**:
  - 版本信息卡片：应用名称 + v0.1.0 (MVP) + 版权信息
  - 技术栈标签：Electron(蓝)、React(青)、FastAPI(绿)、SQLite(琥珀)
  - 开源依赖表格：名称、版本、许可 3 列

## 依赖关系
- `react`: React

## 注意事项
- 版本号和依赖信息为静态硬编码，非动态获取
- 技术栈标签使用不同颜色区分
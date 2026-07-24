# App.tsx — 应用根组件

## 概述
整个前端应用的根组件，负责设置路由和认证上下文。组合了 React Router 路由系统、AuthProvider 认证上下文、ProtectedRoute 路由守卫，以及所有业务页面的路由配置。

## 组件/函数详细说明

### App (函数组件)
- **功能**: 应用根组件，定义路由结构和认证守卫
- **关键逻辑**: 
  - 使用 `BrowserRouter` 包裹整个应用
  - 使用 `AuthProvider` 提供全局认证状态
  - 未登录路由：`/login`（登录页）、`/register`（注册页）
  - 受保护路由（需要登录）：`/dashboard`、`/projects/new`、`/projects/:id`、`/reviews`、`/reviews/:reviewId`、`/settings/*`
  - 根路径 `/` 自动重定向到 `/dashboard`

## 路由结构

| 路径 | 组件 | 说明 |
|------|------|------|
| `/login` | LoginPage | 登录页面 |
| `/register` | RegisterPage | 注册页面 |
| `/dashboard` | DashboardPage | 首页仪表盘 |
| `/projects/new` | ProjectCreationPage | 创建新项目 |
| `/projects/:id` | ProjectDetailPage | 项目详情页 |
| `/reviews` | ReviewDashboardPage | 审核仪表盘 |
| `/reviews/:reviewId` | ReviewDetail | 审核详情页 |
| `/settings/*` | SettingsPage | 设置页面（含子路由） |
| `/` | Navigate to /dashboard | 默认重定向 |

## 依赖关系
- `react-router-dom`: BrowserRouter, Routes, Route, Navigate
- `@/m11_auth_pages`: AuthProvider, ProtectedRoute, LoginPage, RegisterPage
- `@/m13_project_creation`: ProjectCreationPage
- `@/m14a_project_skeleton`: ProjectDetailPage
- `@/m12_dashboard`: DashboardPage
- `@/m18_usage_settings`: SettingsPage
- `@/m15_review_dashboard`: ReviewDashboardPage, ReviewDetail

## 注意事项
- `ProtectedRoute` 使用 `<Outlet />` 实现，所有子路由共享认证守卫
- 路由顺序重要：`/` 重定向在最后，避免匹配其他路由
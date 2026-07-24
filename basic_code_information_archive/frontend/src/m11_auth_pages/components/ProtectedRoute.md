# m11_auth_pages/components/ProtectedRoute.tsx — 路由守卫组件

## 概述
实现路由级别的认证守卫，未登录用户自动重定向到登录页。使用 `useAuth` Hook 获取认证状态，加载中时显示加载动画，未认证时重定向到 `/login`。

## 组件详细说明

### ProtectedRoute
- **功能**: 路由守卫组件，包裹需要认证的路由
- **关键逻辑**:
  - `isLoading` 为 true 时：显示居中的旋转加载动画
  - `isAuthenticated` 为 false 时：重定向到 `/login`
  - 认证通过时：渲染 `<Outlet />` 子路由
- **返回值**: React 元素

## 依赖关系
- `react-router-dom`: Navigate, Outlet
- `../contexts/AuthContext`: useAuth

## 注意事项
- 使用 `<Outlet />` 使得该组件可以嵌套其他路由，在 `App.tsx` 中作为父路由使用
- 重定向使用 `replace` 属性，不在浏览器历史中留下记录
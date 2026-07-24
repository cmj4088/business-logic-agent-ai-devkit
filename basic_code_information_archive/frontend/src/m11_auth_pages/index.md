# m11_auth_pages/index.tsx — 认证模块统一入口

## 概述
认证模块的统一导出入口，集中导出所有公开的组件、Hook 和上下文，方便其他模块通过 `@/m11_auth_pages` 统一引用。

## 导出项

| 导出名称 | 来源 | 说明 |
|----------|------|------|
| `AuthProvider` | `./contexts/AuthContext` | 认证上下文提供者 |
| `useAuth` | `./contexts/AuthContext` | 认证 Hook |
| `ProtectedRoute` | `./components/ProtectedRoute` | 路由守卫组件 |
| `LoginPage` | `./components/LoginPage` | 登录页面（默认导出） |
| `RegisterPage` | `./components/RegisterPage` | 注册页面（默认导出） |

## 依赖关系
- `./contexts/AuthContext`: AuthProvider, useAuth
- `./components/ProtectedRoute`: ProtectedRoute
- `./components/LoginPage`: LoginPage（default import）
- `./components/RegisterPage`: RegisterPage（default import）

## 注意事项
- `LoginPage` 和 `RegisterPage` 使用 `export { default as ... }` 语法重新导出默认导出
- 外部模块应通过此入口导入，而非直接引用子模块文件
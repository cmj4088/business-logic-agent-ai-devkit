# m11_auth_pages/hooks/useAuth.ts — useAuth Hook 重新导出

## 概述
该文件是一个简单的重新导出模块，将 `useAuth` Hook 从 `AuthContext` 中导出，方便外部模块通过 `@/m11_auth_pages/hooks/useAuth` 路径引用。

## 函数详细说明

### useAuth
- **功能**: 重新导出 `AuthContext` 中定义的 `useAuth` Hook
- **来源**: `../contexts/AuthContext`
- **返回值**: `AuthContextType`（包含 user, isAuthenticated, isLoading, login, register, logout, refreshAuth）

## 依赖关系
- 导入 `useAuth` from `../contexts/AuthContext`

## 注意事项
- 该文件纯粹为模块组织便利而存在，实际逻辑在 `contexts/AuthContext.tsx` 中
# m11_auth_pages/contexts/AuthContext.tsx — 认证上下文

## 概述
提供全局认证状态管理，是整个认证模块的核心。实现了登录、注册、登出、Token 刷新等功能，通过 React Context 向所有子组件提供认证状态和操作方法。MVP 阶段使用 localStorage 存储 Token。

## 组件/函数详细说明

### AuthContextType (接口)
- **功能**: 认证上下文的类型定义
- **字段**: 继承 `AuthState` 的所有字段 + `login`, `register`, `logout`, `refreshAuth` 方法

### AuthContext
- **功能**: React Context，初始值为 `null`

### saveTokens(tokens)
- **功能**: 将 Token 对存储到 localStorage
- **参数**: `tokens` (TokenPair)
- **关键逻辑**: 分别存储 `access_token` 和 `refresh_token`，键名分别为 `ipd_access_token` 和 `ipd_refresh_token`

### clearTokens()
- **功能**: 清除 localStorage 中的 Token

### getAccessToken()
- **功能**: 获取 access_token
- **返回值**: `string | null`

### AuthProvider({ children })
- **功能**: 认证上下文提供者组件
- **Props**: `children` (React.ReactNode)
- **关键逻辑**:
  - 初始化时检查 localStorage 中是否有 Token，有则调用 `getMeAPI` 验证并获取用户信息
  - 提供 `login` 方法：调用 `loginAPI`，保存 Token，获取用户信息
  - 提供 `register` 方法：调用 `registerAPI`，保存 Token，获取用户信息
  - 提供 `logout` 方法：清除 Token，重置状态
  - 提供 `refreshAuth` 方法：使用 refresh_token 刷新 access_token

### useAuth()
- **功能**: 消费认证上下文的 Hook
- **返回值**: `AuthContextType`
- **关键逻辑**: 如果在 `AuthProvider` 外使用会抛出错误

## 依赖关系
- `react`: createContext, useContext, useState, useEffect, useCallback
- `../types`: User, AuthState, TokenPair
- `../api`: loginAPI, registerAPI, getMeAPI, refreshTokenAPI

## 注意事项
- MVP 阶段使用 localStorage 存储 Token，后续需迁移到 Electron secureStore
- 初始化时 `isLoading` 默认为 `true`，直到 Token 验证完成
- 所有异步方法使用 `useCallback` 包裹，避免不必要的重渲染
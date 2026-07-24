# m11_auth_pages/types.ts — 认证模块类型定义

## 概述
定义认证模块（M11）所需的类型，包括用户信息、登录/注册表单数据、JWT Token 对、认证状态和认证 API 响应包装。

## 类型定义

### User
- **功能**: 用户信息结构
- **字段**: `id` (string), `email` (string), `display_name` (string), `created_at` (string)

### LoginFormData
- **功能**: 登录表单数据结构
- **字段**: `email` (string), `password` (string)

### RegisterFormData
- **功能**: 注册表单数据结构
- **字段**: `email` (string), `password` (string), `confirmPassword` (string), `display_name` (string)

### TokenPair
- **功能**: JWT Token 对
- **字段**: `access_token` (string), `refresh_token` (string), `token_type` (string), `expires_in` (number)

### AuthState
- **功能**: 认证状态
- **字段**: `user` (User | null), `isAuthenticated` (boolean), `isLoading` (boolean)

### AuthApiResponse\<T\>
- **功能**: 认证 API 响应包装，扩展共享 `ApiResponse<T>`，增加 `error` 字段
- **字段**: 继承 `ApiResponse<T>` 的所有字段 + `error?: { message: string }`

## 依赖关系
- 导入 `ApiResponse` from `@/shared/types`

## 注意事项
- `AuthApiResponse` 扩展了 `ApiResponse`，增加了 `error` 字段便于前端统一处理错误
- `TokenPair` 中的 `expires_in` 表示 Token 有效秒数
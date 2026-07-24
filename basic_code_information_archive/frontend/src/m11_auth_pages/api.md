# m11_auth_pages/api.ts — 认证模块 API 调用层

## 概述
封装后端认证相关端点，提供登录、注册、Token 刷新、获取用户信息、登出等 API 调用。内部使用共享的 api-client，并通过 `wrapRequest` 函数将异常统一转为 `AuthApiResponse` 格式。

## 函数详细说明

### wrapRequest\<T\>(fn)
- **功能**: 包装异步请求，捕获异常并转为标准化的 `AuthApiResponse` 格式
- **参数**: `fn` — 返回 Promise 的异步函数
- **返回值**: `Promise<AuthApiResponse<T>>`
- **关键逻辑**: 成功时返回 `{ data, message: '', success: true }`；失败时从异常中提取 `response.data.message` 作为错误信息

### loginAPI(email, password)
- **功能**: 用户登录
- **参数**: `email` (string), `password` (string)
- **返回值**: `Promise<AuthApiResponse<TokenPair>>`
- **API 端点**: `POST /api/auth/login`

### registerAPI(email, password, displayName)
- **功能**: 用户注册
- **参数**: `email` (string), `password` (string), `displayName` (string)
- **返回值**: `Promise<AuthApiResponse<TokenPair>>`
- **API 端点**: `POST /api/auth/register`

### refreshTokenAPI(refreshToken)
- **功能**: 刷新 JWT Token
- **参数**: `refreshToken` (string)
- **返回值**: `Promise<AuthApiResponse<TokenPair>>`
- **API 端点**: `POST /api/auth/refresh`

### getMeAPI()
- **功能**: 获取当前登录用户信息
- **返回值**: `Promise<AuthApiResponse<User>>`
- **API 端点**: `GET /api/auth/me`

### logoutAPI()
- **功能**: 用户登出
- **返回值**: `Promise<AuthApiResponse<Record<string, unknown>>>`
- **API 端点**: `POST /api/auth/logout`

## 依赖关系
- 导入 `post`, `get` from `@/shared/api-client`
- 导入 `AuthApiResponse`, `TokenPair`, `User` from `./types`

## 注意事项
- 所有 API 函数返回 `AuthApiResponse` 而非直接抛出异常，调用方通过 `success` 字段判断结果
- `wrapRequest` 的异常处理依赖 axios 错误对象结构（`response.data.message`）
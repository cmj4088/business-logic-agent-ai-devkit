# shared/api-client.ts — API 客户端

## 概述
基于 axios 的 HTTP 客户端封装，负责处理所有前端 HTTP 请求。提供统一请求/响应拦截器、错误处理、以及通用的 GET/POST/PUT/DELETE 方法，自动解包 API 响应中的 `data` 字段。

## 新增函数（2026-07-25）

### getElectronServerUrl() (async)
- **功能**: 获取 Electron 客户端模式下的远程服务器地址
- **关键逻辑**: 
  - 缓存机制：`electronServerUrl` 变量缓存结果，仅首次调用走 IPC
  - Electron 环境检测：通过 `window.electronAPI.getServerUrl()` 异步获取
  - 回退：非 Electron 环境或获取失败时返回空字符串
  - 浏览器模式（非 Electron）不调用，保持兼容

## 函数/对象详细说明

### apiClient (AxiosInstance)
- **功能**: axios 实例，配置了基础 URL、超时时间（30秒）、默认请求头
- **关键逻辑**: 通过 `axios.create` 创建，baseURL 从 `constants.ts` 的 `API_BASE_URL` 获取

### 请求拦截器（异步）
- **功能**: 请求发送前处理，支持三种模式：
  1. **Vite 开发模式**: 使用 `API_BASE_URL` 环境变量或同源
  2. **Electron 客户端模式**: 自动调用 `getElectronServerUrl()` 获取远程服务器 URL，将相对路径 `/api/...` 拼接为完整 URL（如 `http://121.199.31.157:8000/api/auth/login`）
  3. **正常模式**: 同源请求
- **关键逻辑**: 从 localStorage 获取 token 添加认证头；Electron 模式下将相对 URL 转为绝对 URL

### 响应拦截器
- **功能**: 处理响应错误，根据 HTTP 状态码打印错误日志
- **关键逻辑**: 
  - 401: 未授权
  - 403: 禁止访问
  - 404: 资源未找到
  - 500: 服务器内部错误
  - 网络错误和请求配置错误也会被捕获

### get\<T\>(url, config?)
- **功能**: 通用 GET 请求
- **参数**: `url` (string), `config` (可选 AxiosRequestConfig)
- **返回值**: `Promise<T>`，自动解包 `response.data.data`

### post\<T\>(url, data?, config?)
- **功能**: 通用 POST 请求
- **参数**: `url` (string), `data` (可选), `config` (可选)
- **返回值**: `Promise<T>`

### put\<T\>(url, data?, config?)
- **功能**: 通用 PUT 请求
- **参数**: `url` (string), `data` (可选), `config` (可选)
- **返回值**: `Promise<T>`

### del\<T\>(url, config?)
- **功能**: 通用 DELETE 请求
- **参数**: `url` (string), `config` (可选)
- **返回值**: `Promise<T>`

## 依赖关系
- 导入 `axios` 和 `AxiosInstance`, `AxiosRequestConfig`, `AxiosResponse`
- 导入 `API_BASE_URL` from `./constants`
- 导入 `ApiResponse` from `./types`

## 注意事项
- 所有请求方法自动将 `ApiResponse<T>` 解包为 `T`，业务层无需手动处理
- 响应拦截器只做日志记录，不阻断错误传播，错误仍需业务层捕获
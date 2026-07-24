# models.py — Pydantic 请求/响应模型

## 概述
该文件定义了 m1_auth_security 模块中所有 API 端点的请求体和响应体的数据模型。所有模型均基于 Pydantic 的 `BaseModel`，利用 Pydantic 的类型校验和字段约束功能，确保客户端传入的数据格式正确。该文件不包含任何业务逻辑，纯数据模型定义。

## 类详细说明

### RegisterRequest
- **功能**: 用户注册请求的数据模型
- **字段**:
  - `email: EmailStr` — 用户邮箱，使用 Pydantic 的 `EmailStr` 类型进行邮箱格式校验
  - `password: str` — 密码，最小长度 8 位（`min_length=8`）
  - `display_name: str` — 显示名称，默认值为空字符串，最大长度 50 个字符（`max_length=50`）
- **关键逻辑**: 使用了 Pydantic 的 `Field` 进行字段约束，`...` 表示必填字段；`EmailStr` 类型需要安装 `email-validator` 包作为依赖

### LoginRequest
- **功能**: 用户登录请求的数据模型
- **字段**:
  - `email: EmailStr` — 用户邮箱，使用 `EmailStr` 类型校验
  - `password: str` — 密码，无长度限制（登录时不做密码强度校验）
- **关键逻辑**: 登录时密码字段无 `min_length` 约束，因为密码强度校验仅在注册时进行

### TokenResponse
- **功能**: Token 返回的响应数据模型（定义但未直接在路由中使用，路由返回 `dict`）
- **字段**:
  - `access_token: str` — Session Token（短期，15 分钟）
  - `refresh_token: str` — Refresh Token（长期，30 天）
  - `token_type: str` — Token 类型，默认值为 `"bearer"`
  - `expires_in: int` — Access Token 过期时间，单位为秒

### RefreshRequest
- **功能**: Token 刷新请求的数据模型
- **字段**:
  - `refresh_token: str` — 需要用来刷新的 Refresh Token

### UserResponse
- **功能**: 用户信息返回的响应数据模型（定义但未直接在路由中使用，路由返回 `dict`）
- **字段**:
  - `id: str` — 用户唯一标识
  - `email: str` — 用户邮箱
  - `display_name: str` — 显示名称
  - `created_at: str` — 创建时间（字符串格式）
  - `updated_at: str` — 更新时间（字符串格式）

### ApiKeyRequest
- **功能**: API Key 存储请求的数据模型
- **字段**:
  - `key_name: str` — 密钥名称，用于标识该密钥属于哪个服务（如 `"anthropic"`、`"openai"`）
  - `api_key: str` — API Key 的值（明文，服务端会加密存储）

### ApiKeyResponse
- **功能**: API Key 存储成功后的响应数据模型
- **字段**:
  - `id: str` — 密钥记录的唯一 ID（格式为 `sec_xxxxxxxxxxxx`）
  - `key_name: str` — 密钥名称
  - `created_at: str` — 创建时间（字符串格式）

## 依赖关系
- **Pydantic**: `BaseModel`（基类）、`EmailStr`（邮箱类型）、`Field`（字段约束声明）

## 注意事项
- 虽然定义了 `TokenResponse` 和 `UserResponse` 等响应模型，但路由中实际使用的是 `response_model=dict` 而非直接引用这些 Pydantic 模型，响应模型目前仅作为文档参考和类型提示
- `EmailStr` 类型依赖 `email-validator` 第三方包，如果未安装将导致 Pydantic 校验失败
- 所有时间字段在模型中都定义为 `str` 类型，因为数据库中存储的是格式化后的字符串（`"%Y-%m-%d %H:%M:%S"`），而非 Python `datetime` 对象
- 密码字段在 `RegisterRequest` 中有 `min_length=8` 约束，但在 `LoginRequest` 中没有，这是合理的设计——登录时不应限制密码长度
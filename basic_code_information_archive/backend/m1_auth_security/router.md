# 认证与安全模块 代码说明

## 文件: router.py
- **路径**: `backend/m1_auth_security/router.py`
- **作用**: 定义认证模块的所有 API 端点（注册/登录/Token 刷新/登出/用户信息/API Key 管理），共 8 个接口，挂载在 `/api/auth` 前缀下
- **关键函数/类**:
  - `register()`: `POST /api/auth/register` — 用户注册，验证邮箱和密码强度，创建用户并返回 Token 对
  - `login()`: `POST /api/auth/login` — 用户登录，验证凭据并返回 Token 对
  - `refresh()`: `POST /api/auth/refresh` — 使用 Refresh Token 刷新 Access Token
  - `logout()`: `POST /api/auth/logout` — 登出，撤销当前 Access Token
  - `get_me()`: `GET /api/auth/me` — 获取当前登录用户信息
  - `store_api_key()`: `POST /api/auth/api-keys` — 存储第三方 API Key（Fernet 加密）
  - `get_api_key()`: `GET /api/auth/api-keys/{key_name}` — 查询指定名称的 API Key 是否存在（不返回值）
  - `delete_api_key()`: `DELETE /api/auth/api-keys/{key_name}` — 软删除指定 API Key
- **依赖关系**:
  - 引入: `fastapi.APIRouter`, `m0_infrastructure.database.get_db`, `shared.errors`, `m1_auth_security.auth_service`, `m1_auth_security.models`, `m1_auth_security.middleware`
  - 被引用: `main.py` 中 `app.include_router(router)`
- **最后修改**: 2026-07-07
- **修改原因**: 项目初始化时创建，支撑认证全流程

## 文件: auth_service.py
- **路径**: `backend/m1_auth_security/auth_service.py`
- **作用**: 认证业务逻辑层，封装注册/登录/Token 管理/API Key 加密存储等核心操作
- **关键函数/类**:
  - `AuthService`: 认证服务类，依赖数据库会话
    - `register(email, password, display_name)`: 创建用户（bcrypt 哈希密码）→ 生成 Token → 返回
    - `login(email, password)`: 验证密码 → 生成 Token → 返回
    - `refresh_token(refresh_token)`: 验证 Refresh Token → 生成新的 Token 对
    - `logout(access_token)`: 将 Token 加入黑名单
    - `store_api_key(user_id, key_name, api_key)`: Fernet 加密存储 API Key
    - `get_api_key(user_id, key_name)`: 解密并返回 API Key
    - `delete_api_key(user_id, key_name)`: 软删除（设置 deleted_at）
- **依赖关系**:
  - 引入: `bcrypt`, `m1_auth_security.models`, `m1_auth_security.security`, `shared.errors`
  - 被引用: `router.py` 中各端点调用
- **最后修改**: 2026-07-07
- **修改原因**: 项目初始化时创建

## 文件: models.py
- **路径**: `backend/m1_auth_security/models.py`
- **作用**: 认证模块的 Pydantic 请求/响应模型
- **关键类**: `RegisterRequest`, `LoginRequest`, `RefreshRequest`, `ApiKeyRequest`, `UserResponse`, `TokenResponse`
- **依赖关系**:
  - 引入: `pydantic`, `shared.errors`
  - 被引用: `router.py` 中作为请求体验证和响应格式
- **最后修改**: 2026-07-07
- **修改原因**: 项目初始化时创建

## 文件: security.py
- **路径**: `backend/m1_auth_security/security.py`
- **作用**: 密码哈希与 Token 生成/验证工具函数
- **关键函数**: `hash_password()`, `verify_password()`, `create_access_token()`, `create_refresh_token()`, `verify_token()`
- **依赖关系**:
  - 引入: `jose.jwt`, `bcrypt`, `datetime`, `shared.config`
  - 被引用: `auth_service.py` 中所有 Token 操作
- **最后修改**: 2026-07-07
- **修改原因**: 项目初始化时创建

## 文件: middleware.py
- **路径**: `backend/m1_auth_security/middleware.py`
- **作用**: 认证中间件，提供 `get_current_user` 依赖注入函数，验证 JWT Token 并返回当前用户
- **关键函数**: `get_current_user()`, `require_role()`
- **依赖关系**:
  - 引入: `fastapi.Depends`, `fastapi.HTTPException`, `m1_auth_security.security`
  - 被引用: `router.py` 中受保护端点的 `Depends(get_current_user)`
- **最后修改**: 2026-07-07
- **修改原因**: 项目初始化时创建

## 注意事项
- 所有路由统一返回格式 `{"data": ..., "error": ..., "meta": {"request_id": ""}}`
- API Key 查询出于安全考虑不返回实际值，仅返回存在状态
- Token 黑名单用于登出后立即失效 Token

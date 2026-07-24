# middleware.py — 认证中间件

## 概述
该文件提供了 FastAPI 的认证中间件，通过 Bearer Token 机制提取和验证当前用户身份。核心是 `get_current_user` 异步函数，它被设计为 FastAPI 的依赖注入（`Depends`），可以在任何需要认证的路由中使用。该中间件验证 JWT Token 的有效性、类型正确性、是否已被撤销，并返回用户信息。

## 变量/函数详细说明

### `security_scheme`
- **类型**: `HTTPBearer`
- **功能**: FastAPI 的 HTTP Bearer 认证方案实例
- **关键逻辑**: 使用 `auto_error=False` 参数，这样当请求中没有 Authorization 头时不会自动抛出 403 错误，而是返回 `None`，由 `get_current_user` 自行处理

### `get_current_user(request, credentials, db) -> dict`
- **功能**: 从请求中提取并验证当前用户身份，作为 FastAPI 的依赖注入使用
- **参数**:
  - `request: Request` — FastAPI 的请求对象，当前版本中仅作为依赖声明，方法体内未直接使用
  - `credentials: HTTPAuthorizationCredentials | None` — 通过 `Depends(security_scheme)` 自动提取的 Bearer Token 凭证，若请求中无 Authorization 头则为 `None`
  - `db: AsyncSession` — 通过 `Depends(get_db)` 注入的异步数据库会话
- **返回值**: 字典，包含 `id`、`email`、`display_name`、`created_at`、`updated_at` 五个字段
- **使用方式**:
  ```python
  @app.get("/api/protected")
  async def protected(user: dict = Depends(get_current_user)):
      ...
  ```
- **关键逻辑**:
  1. 检查 `credentials` 是否为 `None`，若是则抛出 `AUTH_ERROR`（401），消息为"未提供认证凭据"
  2. 从 `credentials.credentials` 提取 Token 字符串
  3. 调用 `decode_token()` 解码 JWT，解码失败则抛出 `AUTH_ERROR`（401），消息为"无效或过期的 Token"
  4. 校验 payload 的 `type` 字段是否为 `"access"`，防止将 Refresh Token 当作 Access Token 使用，不符则抛出 `AUTH_ERROR`（401）
  5. 调用 `hash_token()` 对 Token 做 SHA256 哈希
  6. 查询 `sessions` 表中是否存在该 `token_hash` 且 `revoked_at IS NOT NULL` 的记录，若存在说明该 Token 已被撤销（登出），抛出 `AUTH_ERROR`（401），消息为"Token 已被撤销"
  7. 从 payload 提取 `sub`（用户 ID）
  8. 查询 `users` 表获取用户信息，不存在则抛出 `NOT_FOUND`（404）
  9. 返回用户信息字典

## 依赖关系
- **FastAPI**: `Depends`（依赖注入）、`Request`（请求对象）
- **FastAPI Security**: `HTTPBearer`（Bearer Token 提取）、`HTTPAuthorizationCredentials`（凭证数据结构）
- **SQLAlchemy**: `text`（原始 SQL）、`AsyncSession`（异步数据库会话）
- **shared 模块**: `shared.errors`（`ErrorCode`、`AppException`）
- **m0_infrastructure 模块**: `m0_infrastructure.database`（`get_db` 依赖，提供数据库会话）
- **本模块**: `security.py`（`decode_token`、`hash_token`）

## 注意事项
- `security_scheme` 使用 `auto_error=False`，因此 `credentials` 可能为 `None`，函数内部需要显式处理
- Token 撤销检测是通过查询 `sessions` 表中 `revoked_at IS NOT NULL` 实现的，撤销操作（登出）只标记 `revoked_at`，不删除记录
- 该函数设计为 FastAPI 依赖注入，不直接作为独立函数调用，必须通过 `Depends(get_current_user)` 使用
- 虽然函数签名中包含 `request: Request` 参数，但在当前实现中并未直接使用它；保留该参数可能是为了后续扩展（如记录请求日志、IP 地址等）
- 查询用户信息时返回的字段与 `AuthService.get_current_user()` 一致，两者返回相同的数据结构
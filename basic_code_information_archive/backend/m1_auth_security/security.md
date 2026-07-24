# security.py — 安全工具

## 概述
该文件是 m1_auth_security 模块的底层安全工具集，提供密码哈希、JWT Token 签发/验证、唯一 ID 生成、Token 哈希、Fernet 对称加解密等功能。所有函数都是纯函数（无副作用、无状态），被 `auth_service.py` 和 `middleware.py` 调用。该文件不依赖数据库，只依赖配置模块和第三方加密库。

## 函数详细说明

### `hash_password(password: str) -> str`
- **功能**: 使用 bcrypt 算法对明文密码进行哈希
- **参数**: `password` — 明文密码
- **返回值**: bcrypt 哈希后的字符串（包含盐值，格式如 `$2b$12$...`）
- **关键逻辑**: 调用 `bcrypt.gensalt()` 生成随机盐值，然后调用 `bcrypt.hashpw()` 进行哈希，最终返回 UTF-8 解码后的字符串

### `verify_password(password: str, password_hash: str) -> bool`
- **功能**: 验证明文密码是否匹配 bcrypt 哈希
- **参数**:
  - `password` — 明文密码
  - `password_hash` — 数据库存储的 bcrypt 哈希值
- **返回值**: 匹配返回 `True`，否则返回 `False`
- **关键逻辑**: 调用 `bcrypt.checkpw()` 进行安全比较，bcrypt 内部会从哈希值中提取盐值并重新计算

### `generate_user_id() -> str`
- **功能**: 生成用户唯一标识
- **参数**: 无
- **返回值**: 字符串，格式为 `user_xxxxxxxxxxxx`（前缀 `user_` + 12 位十六进制字符）
- **关键逻辑**: 使用 `uuid.uuid4().hex[:12]` 生成随机 12 位十六进制字符串，拼接 `user_` 前缀

### `generate_session_id() -> str`
- **功能**: 生成会话唯一标识
- **参数**: 无
- **返回值**: 字符串，格式为 `sess_xxxxxxxxxxxx`（前缀 `sess_` + 12 位十六进制字符）
- **关键逻辑**: 与 `generate_user_id()` 相同，前缀为 `sess_`

### `generate_secret_id() -> str`
- **功能**: 生成密钥记录唯一标识
- **参数**: 无
- **返回值**: 字符串，格式为 `sec_xxxxxxxxxxxx`（前缀 `sec_` + 12 位十六进制字符）
- **关键逻辑**: 与 `generate_user_id()` 相同，前缀为 `sec_`

### `create_access_token(user_id: str) -> str`
- **功能**: 创建短期的 Session Token（Access Token）
- **参数**: `user_id` — 用户 ID，将作为 JWT payload 的 `sub` 字段
- **返回值**: JWT 编码后的 Token 字符串
- **关键逻辑**:
  1. 从配置获取 `settings.jwt_secret` 和 `settings.jwt_algorithm`
  2. 构建 payload，包含：
     - `sub`: 用户 ID
     - `type`: 固定为 `"access"`
     - `iat`: 签发时间（UTC）
     - `exp`: 过期时间 = 当前时间 + `settings.session_token_expire_minutes` 分钟
     - `jti`: JWT 唯一 ID（`uuid.uuid4().hex`）
  3. 调用 `jwt.encode()` 编码

### `create_refresh_token(user_id: str) -> str`
- **功能**: 创建长期的 Refresh Token
- **参数**: `user_id` — 用户 ID
- **返回值**: JWT 编码后的 Token 字符串
- **关键逻辑**: 与 `create_access_token()` 类似，区别在于：
  - `type` 字段为 `"refresh"`
  - 过期时间 = 当前时间 + `settings.refresh_token_expire_days` 天（而非分钟）

### `decode_token(token: str) -> dict`
- **功能**: 解码并验证 JWT Token
- **参数**: `token` — JWT Token 字符串
- **返回值**: 解码后的 payload 字典（含 `sub`、`type`、`iat`、`exp`、`jti` 等字段）
- **关键逻辑**: 调用 `jwt.decode()` 进行解码和签名验证，若 Token 无效或过期，`jwt.decode()` 会自行抛出异常，由调用方捕获处理

### `hash_token(token: str) -> str`
- **功能**: 对 Token 进行 SHA256 哈希
- **参数**: `token` — JWT Token 字符串
- **返回值**: SHA256 哈希后的十六进制字符串（64 个字符）
- **关键逻辑**: 使用 Python 标准库 `hashlib.sha256()` 进行哈希，用于将 Token 存储到 `sessions` 表的 `token_hash` 字段，避免在数据库中存储原始 Token

### `get_fernet() -> Fernet`
- **功能**: 获取 Fernet 对称加密实例
- **参数**: 无
- **返回值**: `cryptography.fernet.Fernet` 实例
- **关键逻辑**: 从配置读取 `settings.fernet_key`，若未配置则调用 `Fernet.generate_key()` 生成新密钥（注意：每次调用都会生成新密钥，若未在配置中固定密钥，则加密的数据无法被后续解密）

### `encrypt_api_key(api_key: str) -> str`
- **功能**: 使用 Fernet 对称加密 API Key
- **参数**: `api_key` — API Key 明文
- **返回值**: Fernet 加密后的 Base64 编码字符串
- **关键逻辑**: 调用 `get_fernet()` 获取加密实例，然后调用 `f.encrypt()` 加密

### `decrypt_api_key(encrypted: str) -> str`
- **功能**: 使用 Fernet 解密 API Key
- **参数**: `encrypted` — Fernet 加密后的字符串
- **返回值**: 解密后的 API Key 明文
- **关键逻辑**: 调用 `get_fernet()` 获取加密实例，然后调用 `f.decrypt()` 解密

## 依赖关系
- **标准库**: `hashlib`（SHA256）、`uuid`（生成随机 ID）、`datetime`（时间处理）
- **第三方库**:
  - `bcrypt` — 密码哈希与验证
  - `jwt`（PyJWT）— JWT Token 的编码与解码
  - `cryptography.fernet` — Fernet 对称加密/解密
- **shared 模块**: `shared.config`（`get_settings` 函数，提供 `jwt_secret`、`jwt_algorithm`、`session_token_expire_minutes`、`refresh_token_expire_days`、`fernet_key` 等配置项）

## 注意事项
- `get_fernet()` 在 `fernet_key` 未配置时会调用 `Fernet.generate_key()` 生成新密钥，这会导致每次服务重启后无法解密之前加密的数据。生产环境必须确保 `fernet_key` 在配置中固定且持久化
- bcrypt 的 `gensalt()` 每次调用都生成随机盐值，因此即使用户使用相同密码，哈希结果也不同
- `hash_token()` 使用 SHA256 而非 bcrypt，因为 Token 本身就是高熵随机字符串，不需要慢哈希
- JWT 的 `jti`（JWT ID）字段已被生成，但在当前代码中未用于防重放攻击，预留用于后续扩展
- 三个 ID 生成函数（`generate_user_id`、`generate_session_id`、`generate_secret_id`）格式一致，仅前缀不同，使用 `uuid.uuid4().hex[:12]` 截取前 12 位，碰撞概率极低但理论上存在
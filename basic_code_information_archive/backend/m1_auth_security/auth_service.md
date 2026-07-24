# auth_service.py — 认证业务逻辑

## 概述
该文件是 m1_auth_security 模块的核心业务层，封装了用户注册、登录、Token 刷新、登出、API Key 管理（CRUD）等所有与认证相关的业务逻辑。通过 `AuthService` 类对外暴露服务，所有操作均基于异步数据库会话（`AsyncSession`）执行，使用原始 SQL（`text()`）直连数据库，不依赖 ORM 模型。

## 类详细说明

### AuthService
- **功能**: 认证服务的核心类，封装所有认证业务逻辑
- **构造函数参数**:
  - `db: AsyncSession` — 异步数据库会话，由调用方通过 FastAPI 依赖注入传入
- **关键逻辑**: 所有方法均通过 `self.db.execute(text(...))` 执行原始 SQL 语句，手动管理事务提交（`self.db.commit()`）

#### `__init__(self, db: AsyncSession)`
- **功能**: 初始化认证服务实例
- **参数**: `db` — 异步 SQLAlchemy 会话
- **返回值**: 无
- **关键逻辑**: 仅保存数据库会话引用，不做任何连接操作

#### `register(self, email: str, password: str, display_name: str = "") -> dict`
- **功能**: 用户注册
- **参数**:
  - `email` — 用户邮箱
  - `password` — 用户密码（明文，内部会哈希）
  - `display_name` — 显示名称，可选，默认为空字符串；如果为空则自动取邮箱 `@` 前面的部分
- **返回值**: 字典，包含 `access_token`、`refresh_token`、`token_type`（固定为 `"bearer"`）、`expires_in`（秒数）
- **关键逻辑**:
  1. 调用 `validate_email()` 和 `validate_password()` 校验输入合法性
  2. 查询 `users` 表检查邮箱是否已注册，若已存在则抛出 `CONFLICT` 错误（409）
  3. 调用 `generate_user_id()` 生成用户 ID，调用 `hash_password()` 哈希密码
  4. 使用 `datetime.now(timezone.utc)` 作为创建和更新时间
  5. 向 `users` 表插入新用户记录
  6. 提交事务后调用 `_generate_tokens()` 生成 Token 对并返回

#### `login(self, email: str, password: str) -> dict`
- **功能**: 用户登录
- **参数**:
  - `email` — 用户邮箱
  - `password` — 用户密码（明文）
- **返回值**: 字典，与 `register()` 返回值结构相同
- **关键逻辑**:
  1. 从 `users` 表按邮箱查找用户，不存在则抛出 `AUTH_ERROR`（401），错误消息为"邮箱或密码错误"（不区分邮箱不存在和密码错误，防止信息泄露）
  2. 调用 `verify_password()` 验证密码
  3. 验证通过后调用 `_generate_tokens()` 生成 Token 对

#### `refresh_token(self, refresh_token: str) -> dict`
- **功能**: 使用 Refresh Token 刷新 Session Token
- **参数**: `refresh_token` — 之前登录时获取的 Refresh Token 字符串
- **返回值**: 字典，包含新的 Token 对
- **关键逻辑**:
  1. 调用 `decode_token()` 解码 Refresh Token
  2. 校验 payload 中的 `type` 字段是否为 `"refresh"`，否则抛出 `AUTH_ERROR`（401）
  3. 从 payload 提取 `sub`（即用户 ID）
  4. 验证用户是否仍然存在于数据库中，不存在则抛出 `NOT_FOUND`（404）
  5. 调用 `_generate_tokens()` 生成新的 Token 对

#### `logout(self, access_token: str) -> None`
- **功能**: 用户登出，将当前 Access Token 加入黑名单（撤销）
- **参数**: `access_token` — 需要撤销的 Access Token 字符串
- **返回值**: 无
- **关键逻辑**:
  1. 调用 `hash_token()` 对 Token 进行 SHA256 哈希
  2. 更新 `sessions` 表中匹配的 `token_hash` 且 `revoked_at IS NULL` 的记录，将 `revoked_at` 设为当前时间
  3. 提交事务

#### `get_current_user(self, user_id: str) -> dict | None`
- **功能**: 根据用户 ID 获取当前用户信息
- **参数**: `user_id` — 用户唯一标识
- **返回值**: 用户信息字典（含 `id`、`email`、`display_name`、`created_at`、`updated_at`），若用户不存在返回 `None`
- **关键逻辑**: 直接从 `users` 表查询，不抛异常，由调用方决定如何处理

#### `store_api_key(self, user_id: str, key_name: str, api_key: str) -> dict`
- **功能**: 加密存储第三方 API Key（如 Anthropic、OpenAI 的密钥）
- **参数**:
  - `user_id` — 用户 ID
  - `key_name` — 密钥名称（如 `"anthropic"`、`"openai"`）
  - `api_key` — API Key 明文值
- **返回值**: 字典，包含 `id`（密钥 ID）、`key_name`、`created_at`
- **关键逻辑**:
  1. 调用 `encrypt_api_key()` 使用 Fernet 对称加密
  2. 调用 `generate_secret_id()` 生成唯一密钥 ID
  3. 向 `secrets` 表插入加密后的值
  4. 提交事务

#### `get_api_key(self, user_id: str, key_name: str) -> str | None`
- **功能**: 获取并解密 API Key
- **参数**:
  - `user_id` — 用户 ID
  - `key_name` — 密钥名称
- **返回值**: 解密后的 API Key 明文，若不存在返回 `None`
- **关键逻辑**:
  1. 查询 `secrets` 表中 `user_id` 和 `key_name` 匹配且 `deleted_at IS NULL` 的记录
  2. 按 `created_at DESC` 排序取最新一条（`LIMIT 1`）
  3. 调用 `decrypt_api_key()` 解密后返回

#### `delete_api_key(self, user_id: str, key_name: str) -> None`
- **功能**: 软删除 API Key
- **参数**:
  - `user_id` — 用户 ID
  - `key_name` — 密钥名称
- **返回值**: 无
- **关键逻辑**: 更新 `secrets` 表中匹配记录的 `deleted_at` 字段为当前时间，不物理删除数据

#### `_generate_tokens(self, user_id: str) -> dict`（私有方法）
- **功能**: 生成 Access Token 和 Refresh Token 对，并将会话记录写入数据库
- **参数**: `user_id` — 用户 ID
- **返回值**: 字典，包含 `access_token`、`refresh_token`、`token_type`、`expires_in`
- **关键逻辑**:
  1. 通过 `__import__("shared.config", fromlist=["get_settings"]).get_settings()` 动态导入配置（避免循环导入）
  2. 调用 `create_access_token()` 和 `create_refresh_token()` 生成 Token
  3. 调用 `hash_token()` 对 Access Token 做 SHA256 哈希
  4. 调用 `generate_session_id()` 生成会话 ID
  5. 根据 `settings.session_token_expire_minutes` 计算过期时间
  6. 向 `sessions` 表插入会话记录
  7. 提交事务后返回 Token 对

## 依赖关系
- **标准库**: `uuid`、`datetime`
- **SQLAlchemy**: `text`（用于编写原始 SQL）、`AsyncSession`（异步数据库会话）
- **shared 模块**: `shared.errors`（`ErrorCode` 枚举、`AppException` 异常类）、`shared.validators`（`validate_email`、`validate_password`）
- **本模块**: `security.py`（哈希、加密、Token 生成、ID 生成等工具函数）

## 注意事项
- 所有数据库操作均使用原始 SQL（`text()`）而非 ORM，直接操作 `users`、`sessions`、`secrets` 三张表
- `_generate_tokens` 方法使用 `__import__` 动态导入配置模块，这是为了避免在模块顶层导入时产生循环依赖问题
- 登出操作仅撤销 Access Token，不处理 Refresh Token；Refresh Token 在过期前仍可用来刷新
- 登录失败时统一返回"邮箱或密码错误"，不区分具体失败原因，是一个安全最佳实践
- 注册时若 `display_name` 为空，自动取邮箱 `@` 前的部分作为默认显示名称
- 所有时间均使用 UTC 时区（`datetime.now(timezone.utc)`）
# M1: 认证与安全 — CLAUDE.md

> **模块编号**：M1
> **模块名称**：认证与安全
> **负责 Agent**：后端开发 A
> **开发周期**：Week 1-2
> **上游依赖**：M0（基础设施）
> **下游被依赖**：M2（工作流引擎）、M3（提示词系统）、M4（Agent 编排）、M5（产出物管理）、M7（插件系统）、M8（实时通信）、M9（用量追踪）、M10（异常恢复）、M11（认证页面）、M18（用量与设置页）

---

## 职责范围

M1 负责用户身份认证和安全中间件：
1. **用户注册/登录**：邮箱 + 密码注册，JWT Token 认证
2. **Token 管理**：Session Token（15 分钟）+ Refresh Token（30 天）
3. **密码安全**：bcrypt 哈希，密码强度校验（≥8 位，含数字+字母）
4. **API Key 管理**：Anthropic/OpenAI API Key 的加密存储（Fernet）
5. **安全中间件**：认证中间件、CORS 中间件、Rate Limiting
6. **会话管理**：token 黑名单（登出时失效）

---

## 输入依赖

| 依赖 | 来源 | 用途 |
|------|------|------|
| FastAPI app 实例 | M0 | 注册路由和中间件 |
| 数据库会话 | M0 (`get_db`) | 用户 CRUD |
| 配置对象 | M0 (`settings`) | JWT secret、token 过期时间 |
| 日志 | M0 (`logger`) | 登录事件日志 |

---

## 输出接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录，返回 token 对 |
| `/api/auth/refresh` | POST | 刷新 session token |
| `/api/auth/logout` | POST | 登出，token 加入黑名单 |
| `/api/auth/me` | GET | 获取当前用户信息 |
| `get_current_user()` | 依赖注入 | 认证中间件，其他模块通过此依赖获取当前用户 |
| `encrypt_api_key(key: str) -> str` | 函数 | 加密 API Key（Fernet） |
| `decrypt_api_key(encrypted: str) -> str` | 函数 | 解密 API Key |

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `router.py` | FastAPI 路由（注册/登录/刷新/登出/me） |
| `auth_service.py` | 认证业务逻辑（密码哈希、Token 签发、Token 验证） |
| `models.py` | Pydantic 模型（RegisterRequest, LoginRequest, TokenResponse） |
| `security.py` | 安全工具（Fernet 加解密、bcrypt 哈希、JWT 签发/验证） |
| `middleware.py` | 认证中间件（Bearer Token 提取和验证） |
| `rate_limiter.py` | 频率限制（登录失败 5 次/分钟锁定 15 分钟） |

---

## JWT 配置详情

| 参数 | 值 | 说明 |
|------|------|------|
| 算法 | HS256 | 对称加密，适合单机部署 |
| Secret 来源 | 环境变量 `JWT_SECRET` | 未设置则启动报错 |
| Session Token 有效期 | 15 分钟 | 短期有效 |
| Refresh Token 有效期 | 30 天 | 长期有效 |
| Token Payload | `{sub: user_id, exp: timestamp, type: "access"/"refresh"}` | sub 为用户 ID |
| 黑名单存储 | SQLite `sessions` 表 | revoked_at 字段标记失效 |
| 刷新策略 | 到期前 5 分钟自动刷新 | 前端 M11 的 useTokenRefresh 负责 |

---

## 数据库表

- `users`：用户表（id, email, password_hash, display_name, created_at, updated_at）
- `secrets`：加密密钥表（id, user_id, key_name, encrypted_value, created_at, deleted_at）
- `sessions`：会话表（id, user_id, token_hash, expires_at, revoked_at）

---

## 完成标准

- [ ] 注册/登录/刷新/登出/me 5 个端点全部可用
- [ ] 密码 bcrypt 哈希存储，明文密码不落盘
- [ ] Token 过期后 refresh 端点能正常刷新
- [ ] 登出后 token 加入黑名单，无法继续使用
- [ ] API Key 加密存储（Fernet），解密后内存中使用
- [ ] 登录失败 5 次后锁定 15 分钟
- [ ] 认证中间件正确拦截未认证请求（返回 401）

---

## 禁止事项

1. **禁止明文存储密码**（必须 bcrypt 哈希）
2. **禁止在日志中输出密码、Token、API Key**
3. **禁止 Token 永不过期**（Session 15 分钟，Refresh 30 天）
4. **禁止绕过认证中间件的端点**（除了 register/login/health 外全部需要认证）
5. **禁止 API Key 明文存储**（必须 Fernet 加密后存数据库）
6. **禁止使用 JWT 之外的认证方式**（如 Basic Auth、Session Cookie）

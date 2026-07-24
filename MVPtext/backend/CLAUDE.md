# 后端公共规则 — CLAUDE.md

> **适用范围**：`MVPtext/backend/` 下所有模块
> **参考文档**：`docs/mvp-guide-v2.md`、`docs/api-design.md`、`docs/database-schema-v3.md`

---

## 技术栈

- **语言**：Python 3.11+（类型注解完整，mypy strict）
- **框架**：FastAPI + Pydantic v2
- **数据库**：SQLite 3 + WAL 模式 + SQLAlchemy 2.0（async）
- **LLM 客户端**：httpx（Ollama REST API）、anthropic SDK、openai SDK
- **加密**：cryptography.Fernet（密钥加密）、bcrypt（密码哈希）
- **日志**：structlog（结构化日志）
- **测试**：pytest + pytest-asyncio + httpx AsyncClient

---

## 目录约定

每个模块目录结构：
```
backend/mX-模块名/
├── __init__.py
├── router.py          # FastAPI APIRouter
├── service.py         # 业务逻辑
├── models.py          # Pydantic 模型（请求/响应）
├── db.py              # 数据库操作（如有）
├── tests/
│   └── test_*.py
└── CLAUDE.md
```

---

## 数据库规则

### 连接配置（必须）
```python
# 所有数据库连接必须使用以下 PRAGMA 配置
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA busy_timeout=5000;
PRAGMA foreign_keys=ON;
PRAGMA cache_size=-8000;
```

### 操作规则
1. 所有 SQL 使用参数化查询（SQLAlchemy 参数绑定或 `?` 占位符），禁止 f-string 拼接
2. 写入操作必须显式 commit，异常时 rollback
3. 敏感字段（api_key, secret, password_hash）使用 Fernet 加密存储
4. 软删除：`deleted_at` 字段代替物理删除
5. 所有表必须有 `created_at` 和 `updated_at` 字段（DEFAULT datetime('now')）

---

## API 规则

### 响应格式（统一）
```json
{
  "data": { ... },
  "error": null,
  "meta": { "page": 1, "page_size": 20, "total": 150, "request_id": "uuid" }
}
```

### 命名规则
- 资源复数：`/api/projects` 不是 `/api/project`
- 嵌套 ≤ 两层：`/api/projects/{id}/stages`
- 动作用动词：`POST /api/projects/{id}/advance`
- 批量操作用复数：`POST /api/reviews/batch`

### 认证
- `Authorization: Bearer <session_token>`
- Session token 15 分钟有效，Refresh token 30 天有效

### 错误码
- `VALIDATION_` → 422
- `NOT_FOUND` → 404
- `FORBIDDEN_` → 403
- `CONFLICT_` → 409
- `LLM_` → 502
- `AUTH_` → 401
- `INTERNAL_` → 500

---

## 安全规则

### 数据过滤（必须）
所有发送到 LLM 的文本必须先经过 `data_filter.py`：
```python
from shared.data_filter import filter_sensitive_data
# 在发送给 LLM 之前
safe_text = filter_sensitive_data(raw_text)
```

### 输入校验
1. 所有 API 输入使用 Pydantic v2 模型校验
2. 字符串字段设置 max_length（防御 DoS）
3. 文件上传校验 magic bytes（不是扩展名）
4. 路径参数防止路径遍历攻击（`..` 检测）

### 禁止事项
1. **禁止在日志中输出密钥/密码/Token/身份证号/手机号/邮箱**
2. **禁止硬编码任何密钥或 API Key**
3. **禁止绕过 data_filter 直接发送数据到 LLM**
4. **禁止在异常消息中暴露内部路径或数据库结构**

---

## LLM 调用规则

### LLM Router 降级链
```
Ollama（本地默认）→ Anthropic → OpenAI → Ollama（回退本地）
```

### LLM 配置示例（config.yaml）
```yaml
llm:
  default: ollama
  ollama:
    base_url: http://localhost:11434
    default_model: qwen2.5
    timeout: 300
  anthropic:
    api_key_env: ANTHROPIC_API_KEY
    default_model: claude-sonnet-4-5
    timeout: 300
  openai:
    api_key_env: OPENAI_API_KEY
    default_model: gpt-4o
    timeout: 300
  fallback_chain:
    - ollama
    - anthropic
    - openai
  circuit_breaker:
    max_failures: 5
    retry_after_minutes: 10
  format_retry:
    max_retries: 2
    fallback_to_text: true
```

### SDK 版本要求
- anthropic SDK ≥ 0.30.0
- openai SDK ≥ 1.0.0
- httpx ≥ 0.27.0（Ollama REST API）

### 调用要求
1. 每次调用必须设置 timeout（默认 300 秒）
2. 失败重试最多 3 次（指数退避：1s, 2s, 4s）
3. 连续 5 次失败触发熔断器，自动切换备用模型
4. 记录每次调用的 token 用量（用于 M9 成本追踪）

---

## API 响应格式补充

| 端点类型 | `meta` 内容 | 说明 |
|---------|------------|------|
| 列表端点 | `{page, page_size, total, request_id}` | 含分页信息 |
| 单资源端点 | `{request_id}` | 仅含请求追踪 ID |
| 操作端点 | `{request_id}` | POST/PUT/DELETE 等非查询操作 |

---

## 日志配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| 日志级别 | INFO | DEBUG 仅在开发环境 |
| 输出格式 | JSON（stdout） | 结构化日志，便于解析 |
| 文件路径 | `logs/app.log` | 可配置，通过 config.yaml |
| 轮转策略 | 10MB/5 个备份 | RotatingFileHandler |
| 敏感字段脱敏 | 自动 | 密码、Token、身份证号、手机号、邮箱 |

---

## 共享模块

`shared/` 目录提供以下跨模块共享内容：
- `shared/data_filter.py` — 敏感数据过滤
- `shared/config.py` — 配置加载
- `shared/types.py` — 共享类型定义
- `shared/constants.py` — 全局常量
- `shared/errors.py` — 错误码定义

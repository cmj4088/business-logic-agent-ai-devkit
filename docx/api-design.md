# API 端点设计 v3

> v2 → v3 变更：邮箱验证流程、附件下载、阶段回退端点、项目级提示词覆盖、Webhook 测试、Dashboard 聚合端点、计数修正。

---

## 一、基础约定

### 1.1 统一响应格式

```json
// 成功
{
  "data": { ... },
  "error": null,
  "meta": { "page": 1, "page_size": 20, "total": 150, "request_id": "uuid" }
}

// 失败
{
  "data": null,
  "error": { "code": "PROJECT_NOT_FOUND", "message": "项目不存在或已被删除" },
  "meta": { "request_id": "uuid" }
}
```

### 1.2 命名规则

| 规则 | 示例 |
|------|------|
| 资源复数 | `/api/projects` 不是 `/api/project` |
| 嵌套 ≤ 两层 | `/api/projects/{id}/stages` |
| 动作用动词 | `/api/projects/{id}/advance` |
| 批量操作用复数 | `POST /api/reviews/batch` |

### 1.3 认证

```
Authorization: Bearer <session_token>
```

Session token 短期有效（15 分钟），Refresh token 长期有效（30 天）。登录时两个都返回。

### 1.4 分页（统一参数）

所有列表端点统一使用：

```
?page=1&page_size=20&sort=updated_at&order=desc
```

| 参数 | 默认值 | 最大值 |
|------|--------|--------|
| `page` | 1 | - |
| `page_size` | 20 | 100 |
| `sort` | `created_at` | 各端点不同 |
| `order` | `desc` | - |

### 1.5 错误码

| 前缀 | HTTP | 含义 |
|------|------|------|
| `VALIDATION_` | 422 | 参数校验失败 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `FORBIDDEN_` | 403 | 权限不足 |
| `CONFLICT_` | 409 | 状态冲突 |
| `RATE_LIMIT_` | 429 | 频率限制 |
| `LLM_` | 502 | LLM 调用失败 |
| `AUTH_` | 401 | 认证失败/过期 |
| `INTERNAL_` | 500 | 服务器内部错误 |

---

## 二、端点总览

| 模块 | 端点数 | 说明 |
|------|--------|------|
| 健康 | 1 | 健康检查 |
| 认证 | 11 | 注册/验证/登录/Token/密码 |
| 项目 | 11 | CRUD + 恢复 + 克隆 + 回退 + 状态 |
| 搜索 | 1 | 全文搜索 |
| Dashboard | 1 | 跨项目聚合首页 |
| 工作流 | 14 | 模板 + 市场 + 实例 + 阶段 + 门禁 |
| Agent | 8 | 配置 + 编排 + 轮次 |
| 提示词 | 7 | 全局版本 + 项目级覆盖 |
| 评估 | 3 | Agent 产出评估 |
| 消息 | 4 | CRUD + 流式 |
| 产出物 | 9 | 文档 + 版本 + 附件上传/下载 |
| 插件 | 7 | 安装/卸载/配置/市场 |
| 用量 | 3 | 成本追踪 |
| 审核 | 7 | 人机协同 |
| Webhook | 6 | 管理 + 测试 + 日志 |
| 设置 | 4 | 应用设置 |
| 密钥 | 5 | 凭证 + API Token |
| 审计 | 2 | 审计日志 |
| 通知 | 4 | 通知管理 |
| 数据 | 3 | GDPR 导出/删除 |
| 组织 | 8 | B2B 多租户 |
| SSO | 3 | 单点登录配置 |
| 演示 | 2 | 演示项目 |
| WebSocket | 5 | 实时通信 |
| SSE | 1 | SSE fallback |

**总计：124 REST + 5 WS + 1 SSE**

---

## 三、健康检查（1 端点）

```
GET /api/health
```

```json
// Response
{
  "data": {
    "status": "ok",
    "version": "1.0.0",
    "uptime_seconds": 86400,
    "checks": {
      "database": "ok",
      "llm_anthropic": "ok",
      "llm_openai": "degraded",
      "chromadb": "ok"
    }
  }
}
```

---

## 四、认证模块（11 端点）

```
POST   /api/auth/register                       # 注册
POST   /api/auth/verify-email                   # 验证邮箱
POST   /api/auth/resend-verification            # 重发验证邮件
POST   /api/auth/login                          # 登录
POST   /api/auth/logout                         # 登出
POST   /api/auth/refresh                        # 刷新 Token
POST   /api/auth/forgot-password                # 忘记密码
POST   /api/auth/reset-password                 # 重置密码
GET    /api/auth/me                             # 当前用户信息
PATCH  /api/auth/me                             # 更新个人信息（不含密码）
PATCH  /api/auth/me/password                    # 修改密码
```

### POST /api/auth/register

```json
// Request
{
  "name": "小王",
  "email": "user@example.com",
  "password": "min_8_chars_with_number",
  "invite_code": "optional_for_closed_beta"
}

// Response 201
{
  "data": {
    "user": { "id": "u1", "name": "小王", "email": "user@example.com" },
    "session_token": "eyJhbGciOiJSUzI1NiIs...",
    "session_expires_at": "2026-07-04T10:45:00Z",
    "refresh_token": "r8k2m9x...",
    "refresh_expires_at": "2026-08-03T10:30:00Z"
  }
}

// 注册后账户状态为 "unverified"，LLM 调用受限，直到邮箱验证通过
```

### POST /api/auth/verify-email

```json
// Request
{ "token": "verification_token_from_email" }

// Response
{ "data": { "message": "邮箱验证成功，账户已激活" } }
```

### POST /api/auth/resend-verification

```json
// Request
{ "email": "user@example.com" }

// Response（始终 200，不暴露邮箱是否存在）
{ "data": { "message": "如果该邮箱未验证，验证邮件已重新发送" } }
```

**验证策略：**
- 注册后 24 小时内未验证 → 账户自动清理
- 未验证账户 LLM 调用限额：3 次/天（防止滥用）
- 验证通过后恢复正常额度
- 验证邮件中的链接指向 `ipd-agent://verify?token=xxx`（桌面应用自定义协议）

### POST /api/auth/login

```json
// Request
{ "email": "user@example.com", "password": "..." }

// Response
{
  "data": {
    "user": { "id": "u1", "name": "小王", "email": "user@example.com" },
    "session_token": "eyJhbGciOiJSUzI1NiIs...",
    "session_expires_at": "2026-07-04T10:45:00Z",
    "refresh_token": "r8k2m9x...",
    "refresh_expires_at": "2026-08-03T10:30:00Z"
  }
}
```

### POST /api/auth/refresh

```json
// Request
{ "refresh_token": "r8k2m9x..." }

// Response
{
  "data": {
    "session_token": "eyJhbGciOiJSUzI1NiIs...",
    "session_expires_at": "2026-07-04T11:00:00Z",
    "refresh_token": "new_r8k2m9x...",
    "refresh_expires_at": "2026-08-03T11:00:00Z"
  }
}
```

**Token 策略：**
- `session_token`：RS256 JWT，15 分钟过期，用于 API 请求
- `refresh_token`：随机字符串（SHA256 存库），30 天过期，仅用于换新 session_token
- refresh 成功后旧 refresh_token 立即失效（轮换防重放）

### POST /api/auth/forgot-password

```json
// Request
{ "email": "user@example.com" }

// Response（始终返回 200，不暴露邮箱是否存在）
{
  "data": { "message": "如果该邮箱已注册，重置链接已发送" }
}
```

### POST /api/auth/reset-password

```json
// Request
{
  "token": "reset_token_from_email",
  "new_password": "new_min_8_chars"
}
```

### PATCH /api/auth/me — 更新个人信息

```json
// Request（不含密码，密码修改走独立端点）
{
  "name": "小王2",
  "avatar_url": "https://...",
  "notification_preferences": { "email_digest": true }
}
```

### PATCH /api/auth/me/password — 修改密码

```json
// Request
{
  "current_password": "...",
  "new_password": "new_min_8_chars"
}
```

---

## 五、项目模块（11 端点）

```
GET    /api/projects                              # 列表
POST   /api/projects                              # 创建
GET    /api/projects/{id}                         # 详情
PATCH  /api/projects/{id}                         # 更新
DELETE /api/projects/{id}                         # 软删除
POST   /api/projects/{id}/restore                 # 恢复已删除项目
POST   /api/projects/{id}/clone                   # 克隆项目
POST   /api/projects/{id}/advance                 # 推进阶段
POST   /api/projects/{id}/rollback                # 回退到上一阶段
POST   /api/projects/{id}/pause                   # 暂停
POST   /api/projects/{id}/resume                  # 恢复
```

### POST /api/projects/{id}/restore

```json
// Response
{
  "data": {
    "id": "proj_abc123",
    "status": "active",
    "restored_at": "2026-07-04T11:00:00Z"
  }
}
```

已删除项目保留 30 天，超期后物理删除不可恢复。

### POST /api/projects/{id}/clone

```json
// Request
{
  "name": "智能音箱 Pro 版",
  "clone_options": {
    "artifacts": true,
    "agent_configs": true,
    "settings": true,
    "messages": false
  }
}

// Response
{
  "data": {
    "id": "proj_clone123",
    "name": "智能音箱 Pro 版",
    "cloned_from": "proj_abc123"
  }
}
```

### POST /api/projects/{id}/advance — 推进阶段（语义澄清）

```json
// Request
{
  "force": false
  // force=false: 阻断级标准必须全部通过，关注级可未完成（记录为遗留问题）
  // force=true:  跳过所有 exit criteria 检查直接推进（仅管理员可用，需填写理由）
  //              用于紧急情况，会记录到审计日志
  "force_reason": "紧急发布，管理层已批准跳过验证"
}

// Response（force=false, 有遗留问题）
{
  "data": {
    "from_stage": "concept",
    "to_stage": "plan",
    "transition": "cdcp_passed",
    "blocking_passed": 3,
    "blocking_total": 3,
    "advisory_open": [
      {"id": "c_adv_2", "description": "合规预评估已完成", "status": "open"}
    ],
    "warning": "有 1 项关注级标准未完成，已记录为遗留问题，PDCP 时检查"
  }
}
```

### POST /api/projects/{id}/rollback — 回退阶段

```json
// Request
{
  "target_stage": "develop",
  "reason": "TR5 测试未通过，需回退到开发阶段修复问题"
}

// Response
{
  "data": {
    "from_stage": "verify",
    "to_stage": "develop",
    "rollback_count": 1,
    "max_rollbacks": 2,
    "warning": "已回退到开发阶段。剩余回退次数: 1。回退前验证阶段的产出物已归档。"
  }
}
```

**约束**：
- 仅当模板 `stage_edges` 中对应边 `allow_rollback: true` 时才可用
- 超过 `max_rollbacks` 后回退端点返回 409
- 回退时当前阶段产出物自动归档（不丢失）
- 回退操作记录到审计日志

---

## 六、搜索模块（1 端点）

```
GET /api/search
```

```
Query: ?q=蓝牙&scope=projects,artifacts,messages&project_id=proj_abc&page=1&page_size=20
```

| 参数 | 说明 |
|------|------|
| `q` | 搜索关键词（必填） |
| `scope` | 搜索范围，逗号分隔：`projects,artifacts,messages` |
| `project_id` | 限定项目（可选）。不传则搜索用户有权访问的所有项目 |
| `page`, `page_size` | 分页 |

### 权限隔离规则（v3 新增）

> **审查发现**：搜索 API 的跨项目权限隔离模型缺失。必须明确以下规则：

- 搜索范围自动限制为用户有权访问的项目（基于 `projects.owner_id`）
- 不传 `project_id` 时，后端强制注入 `WHERE project_id IN (用户的项目列表)`
- `snippet` 字段截断为 150 字符，防止通过搜索片段窃取完整文档
- 搜索结果不包含 `secrets`、`audit_logs`、`usage_records` 等敏感表
- 搜索 `messages` 时排除 `message_type = 'system'` 的系统消息

```json
// Response
{
  "data": {
    "query": "蓝牙",
    "total": 42,
    "results": [
      {
        "type": "artifact",
        "id": "art_123",
        "project_id": "proj_abc",
        "project_name": "智能音箱TWS-2026",
        "title": "MRD v2 — TWS耳机市场需求文档",
        "snippet": "...支持蓝牙5.3协议，兼容LE Audio...",
        "highlight": "...支持<mark>蓝牙</mark>5.3协议...",
        "updated_at": "2026-07-03T15:00:00Z"
      },
      {
        "type": "message",
        "id": "msg_456",
        "project_id": "proj_abc",
        "sender": "研发-陈工",
        "snippet": "蓝牙芯片选型建议用A厂商的QCC5181...",
        "created_at": "2026-07-02T10:30:00Z"
      }
    ]
  }
}
```

---

## 七、工作流模块（14 端点）

```
GET    /api/workflows/templates                             # 模板列表
GET    /api/workflows/templates/{id}                        # 模板详情
POST   /api/workflows/templates                             # 导入模板
PUT    /api/workflows/templates/{id}                        # 更新模板
DELETE /api/workflows/templates/{id}                        # 删除模板
POST   /api/workflows/templates/{id}/validate               # 校验模板
GET    /api/workflows/templates/marketplace                  # 模板市场
POST   /api/workflows/templates/marketplace/{id}/install     # 从市场安装模板
GET    /api/workflows/instances/{id}                        # 实例详情
GET    /api/workflows/instances/{id}/stages                 # 阶段状态
PATCH  /api/workflows/instances/{id}/stages/{stage_id}      # 更新阶段
GET    /api/workflows/instances/{id}/gates                  # 门禁状态
POST   /api/workflows/instances/{id}/gates/{gate_id}/vote   # 门禁投票
GET    /api/workflows/instances/{id}/gates/{gate_id}/results # 门禁结果
```

同 v1，增加模板市场 2 个端点。

---

## 八、Agent 模块（8 端点）

同 v1，无变更。

---

## 九、提示词模块（5 端点）

```
GET    /api/prompts                                   # 提示词列表（全局，按角色）
GET    /api/prompts/{role_id}                         # 当前生效版本（全局）
GET    /api/prompts/{role_id}/versions                # 版本历史
POST   /api/prompts/{role_id}/versions/{version}/rollback  # 回退到指定版本
GET    /api/projects/{id}/prompts/{role_id}            # 项目级提示词覆盖
PATCH  /api/projects/{id}/prompts/{role_id}            # 设置项目级覆盖
DELETE /api/projects/{id}/prompts/{role_id}            # 移除覆盖，恢复全局版本
```

### GET /api/projects/{id}/prompts/{role_id} — 项目级覆盖

```json
// Response（有覆盖时）
{
  "data": {
    "role_id": "product_manager",
    "source": "project_override",
    "override": "你是一位专注于音频产品的产品经理，特别关注声学性能...",
    "overridden_at": "2026-07-04",
    "global_version": "v4"
  }
}

// Response（无覆盖时，回退到全局）
{
  "data": {
    "role_id": "product_manager",
    "source": "global",
    "global_version": "v4"
  }
}
```

### GET /api/prompts/{role_id}/versions

```json
// Response
{
  "data": [
    {"version": "v4", "status": "active", "quality_score": 0.72, "active_since": "2026-07-01"},
    {"version": "v3", "status": "rolled_back", "quality_score": 0.85, "rollback_reason": "v4被驳回率上升"},
    {"version": "v2", "status": "archived", "quality_score": 0.80}
  ]
}
```

---

## 十、评估模块（3 端点）

```
GET    /api/evaluations                               # Agent 评估记录（按项目/Agent 筛选）
POST   /api/evaluations                               # 提交评估（审核时自动创建）
GET    /api/evaluations/{id}                          # 评估详情
```

```json
// GET /api/evaluations?agent_id=agt_pm&project_id=proj_abc
{
  "data": {
    "agent_name": "产品经理-小王",
    "trust_score": 0.87,
    "total_evaluations": 45,
    "recent_trend": "stable",
    "by_category": {
      "fact_accuracy": 0.92,
      "output_usability": 0.85,
      "collaboration_quality": 0.84
    }
  }
}
```

---

## 十一、消息模块（4 端点）

同 v1。

---

## 十二、产出物模块（9 端点）

```
GET    /api/projects/{id}/artifacts                          # 列表
POST   /api/projects/{id}/artifacts                          # 创建
GET    /api/projects/{id}/artifacts/{id}                     # 详情
PATCH  /api/projects/{id}/artifacts/{id}                     # 更新
GET    /api/projects/{id}/artifacts/{id}/versions            # 版本历史
POST   /api/projects/{id}/artifacts/{id}/restore/{version}   # 恢复版本
POST   /api/projects/{id}/artifacts/{id}/attachments         # 上传附件
GET    /api/projects/{id}/artifacts/{id}/attachments/{file_id}  # 下载附件
DELETE /api/projects/{id}/artifacts/{id}/attachments/{file_id}  # 删除附件
```

### POST /api/projects/{id}/artifacts/{id}/attachments

```
Content-Type: multipart/form-data

字段:
- file: 文件（最大 50MB）
- description: 附件说明（可选）

支持格式: pdf, xlsx, xls, docx, png, jpg, svg, zip, step, stl
```

```json
// Response
{
  "data": {
    "id": "att_xyz",
    "filename": "BOM-2026Q3.xlsx",
    "size_bytes": 245760,
    "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "uploaded_by": "u1",
    "uploaded_at": "2026-07-04T11:00:00Z"
  }
}
```

---

## 十三、插件模块（7 端点）

同 v1。

---

## 十四、用量模块（3 端点）

同 v1。

---

## 十五、审核模块（7 端点）

同 v1。

---

## 十六、Webhook 模块（6 端点）

```
GET    /api/webhooks                                 # Webhook 列表
POST   /api/webhooks                                 # 创建 Webhook
PATCH  /api/webhooks/{id}                            # 更新 Webhook
DELETE /api/webhooks/{id}                            # 删除 Webhook
POST   /api/webhooks/{id}/test                       # 手动测试（发送示例事件）
GET    /api/webhooks/{id}/logs                       # Webhook 发送日志
```

### POST /api/webhooks/{id}/test

```json
// Response
{
  "data": {
    "delivery_status": "success",
    "response_code": 200,
    "response_body": "OK",
    "latency_ms": 342
  }
}
```

测试时发送一个 `test` 事件到 Webhook URL，验证连通性。不产生真实数据。

### POST /api/webhooks

```json
// Request
{
  "url": "https://company.com/ipd-webhook",
  "events": ["stage_completed", "gate_passed", "budget_deviation"],
  "secret": "whsec_xxx",
  "enabled": true
}

// Response
{
  "data": {
    "id": "wh_abc",
    "url": "https://company.com/ipd-webhook",
    "events": ["stage_completed", "gate_passed", "budget_deviation"],
    "enabled": true,
    "created_at": "..."
  }
}
```

Webhook 投递格式：
```json
{
  "event": "stage_completed",
  "project_id": "proj_abc",
  "project_name": "智能音箱TWS-2026",
  "data": { "from_stage": "concept", "to_stage": "plan" },
  "timestamp": "2026-07-04T11:00:00Z",
  "webhook_id": "wh_abc"
}
```

签名头：`X-IPD-Signature: sha256=...`（HMAC-SHA256，secret 为密钥）

---

## 十七、设置模块（4 端点）

同 v1。

---

## 十八、密钥模块（5 端点）

```
GET    /api/secrets                                    # 密钥列表（脱敏）
POST   /api/secrets                                    # 添加密钥
DELETE /api/secrets/{key}                              # 软删除
POST   /api/secrets/{key}/rotate                       # 轮换
GET    /api/api-tokens                                 # API Token 列表
POST   /api/api-tokens                                 # 创建 API Token
DELETE /api/api-tokens/{id}                            # 吊销 API Token
```

### POST /api/api-tokens — 创建 API Token

```json
// Request
{
  "name": "CI/CD Pipeline",
  "scopes": ["read:projects", "read:artifacts"],
  "expires_at": "2027-07-04T00:00:00Z"
}

// Response
{
  "data": {
    "id": "tok_abc",
    "name": "CI/CD Pipeline",
    "prefix": "ipd_at_a1b2",
    "token": "ipd_at_a1b2c3d4e5f6...",  // 仅此一次返回完整 token
    "scopes": ["read:projects", "read:artifacts"],
    "expires_at": "2027-07-04T00:00:00Z"
  }
}
```

API Token 的 SHA256 哈希存储数据库，前缀 `ipd_at_` + 前 4 字符用于 UI 识别。

---

## 十九、审计模块（2 端点）

同 v1。

---

## 二十、通知模块（4 端点）

同 v1。

---

## 二十一、数据模块（3 端点，GDPR）

```
POST   /api/data-exports                              # 请求导出我的数据
GET    /api/data-exports/{id}                         # 查看导出状态/下载
POST   /api/data-deletion                             # 请求删除我的数据
```

### POST /api/data-exports

```json
// Request
{ "scope": ["projects", "messages", "usage_records"] }

// Response
{
  "data": {
    "id": "exp_abc",
    "status": "processing",
    "estimated_ready_at": "2026-07-04T11:30:00Z"
  }
}
```

---

## 二十二、组织模块（8 端点，B2B 预留）

同 v1。

---

## 二十三、SSO 模块（3 端点，B2B 预留）

```
GET    /api/sso/configs                               # SSO 配置列表
POST   /api/sso/configs                               # 添加 SSO 配置（OIDC/SAML）
DELETE /api/sso/configs/{id}                          # 删除 SSO 配置
```

---

## 二十四、演示模块（2 端点）

```
GET    /api/demo/projects                             # 演示项目列表
POST   /api/demo/projects/{id}/instantiate            # 基于演示项目创建真实项目
```

---

## 二十五、Dashboard 聚合（1 端点）

对应 architecture-v5 首页设计——"需要你处理的" + "系统自动完成的"。

```
GET /api/dashboard
```

```json
// Response
{
  "data": {
    "needs_attention": {
      "urgent": [
        {"type": "gate_vote", "project_id": "proj_abc", "project_name": "智能音箱", "gate": "CDCP", "waiting_hours": 2, "action_url": "/reviews/rev_1"}
      ],
      "today": [
        {"type": "artifact_review", "project_id": "proj_xyz", "project_name": "TWS耳机", "artifact": "MRD v2", "deadline": "2026-07-04T18:00:00Z"}
      ],
      "this_week": [
        {"type": "gate_vote", "project_id": "proj_def", "project_name": "智能手环", "gate": "TR1", "deadline": "2026-07-07T00:00:00Z"}
      ]
    },
    "auto_completed": [
      {"project_name": "智能音箱", "action": "竞品分析已完成", "time": "2 小时前"},
      {"project_name": "TWS耳机", "action": "测试Agent生成32条测试用例", "time": "5 小时前"}
    ],
    "blocked_projects": [
      {"project_name": "智能音箱", "stage": "计划", "blocked_days": 3, "reason": "等待张总监审核TR2", "suggestion": "催一下张总监"}
    ],
    "budget_alerts": [
      {"project_name": "TWS耳机", "deviation_percent": 18, "stage": "开发"}
    ],
    "summary": {
      "active_projects": 5,
      "pending_reviews": 7,
      "total_cost_this_month": 2345.67
    }
  }
}
```

此端点聚合跨项目数据，替换多次单独请求。

---

## 二十六、WebSocket 端点（5 通道）

| 通道 | 方向 | 用途 |
|------|------|------|
| `/ws/rounds/{round_id}` | 服务端→客户端 | Agent 协作轮次流式输出 |
| `/ws/projects/{id}` | 服务端→客户端 | 项目状态变更推送 |
| `/ws/chat/{project_id}` | 双向 | 自由对话模式（模式B预留） |
| `/ws/notifications` | 服务端→客户端 | 实时通知推送 |
| `/ws/widgets/{project_id}` | 服务端→客户端 | 侧边栏小组件状态推送 |

### WebSocket 认证

浏览器端 WebSocket 不支持自定义 Header，认证方式：**连接后首条消息发送 auth**。

```
客户端连接后立即发送:
{ "type": "auth", "token": "<session_token>" }

服务端验证通过后回复:
{ "type": "auth_ok" }

验证失败:
{ "type": "auth_error", "message": "Token 已过期" }
→ 服务端 3 秒后关闭连接
```

**~~备选方案（不推荐但支持）：URL 参数 `?token=xxx`，用于不支持首条消息的轻量客户端。~~**

> **v3 废弃**：URL 参数传 token 存在严重安全隐患——token 会被记录在浏览器历史、代理/防火墙日志、服务器访问日志中。自 v3 起不再支持此方式。所有客户端必须使用首条消息认证。

### 消息格式

```json
{
  "type": "agent_stream|stage_progress|gate_update|widget_status|notification|error|heartbeat",
  "payload": {},
  "timestamp": 1720085400.123,
  "project_id": "proj_abc123",
  "sequence": 42
}
```

### 消息类型

| type | payload | 触发时机 |
|------|---------|---------|
| `agent_stream` | `{"agent_id": "...", "agent_name": "...", "chunk": "...", "done": false}` | 流式输出每个 token |
| `agent_stream` | `{"agent_id": "...", "done": true, "full_message": {...}}` | Agent 完成输出 |
| `stage_progress` | `{"from_stage": "concept", "to_stage": "plan", "trigger": "cdcp_passed"}` | 阶段推进 |
| `gate_update` | `{"gate_id": "cdcp", "status": "passed", "votes": {...}}` | 门禁状态变化 |
| `widget_status` | `{"widget_id": "widget_supply_chain", "status": "yellow", "detail": "..."}` | 侧边栏状态变化 |
| `notification` | `{"id": "...", "title": "...", "body": "...", "action_url": "..."}` | 新通知 |
| `error` | `{"code": "...", "message": "..."}` | 错误 |
| `heartbeat` | `{}` | 每 30 秒 |

---

## 二十七、SSE 备选方案（1 端点）

当 WebSocket 被代理/防火墙阻断时，使用 SSE（Server-Sent Events）：

```
GET /api/rounds/{round_id}/stream
Authorization: Bearer <session_token>
```

```
data: {"type": "agent_stream", "agent_name": "产品经理", "chunk": "各位，"}

data: {"type": "agent_stream", "agent_name": "产品经理", "chunk": "我整理了一份MRD..."}

data: {"type": "agent_stream", "agent_name": "产品经理", "done": true}

data: {"type": "heartbeat"}
```

SSE 是单向的（服务端→客户端），如需客户端发送消息，使用 REST 端点 `POST /api/projects/{id}/messages`。

---

## 二十八、速率限制（v3 完善）

| 层级 | 限制 | 说明 |
|------|------|------|
| 全局 HTTP | 600 req/min | 所有 REST 端点总和 |
| WebSocket 连接建立 | 10 req/min | HTTP upgrade 请求也受保护 |
| WebSocket 并发 | 5 连接/用户 | 同时活跃连接数 |
| 认证 | 5 req/min | 登录/注册/忘记密码 |
| LLM 调用 | 30 req/min | Agent 轮次 |
| 文件上传 | 10 req/min | 插件安装、附件上传 |
| 数据导出 | 1 req/hour | GDPR 导出 |

---

## 二十九、实现优先级（v3 修订）

> **审查发现**：原计划 124 个端点全部实现，但桌面应用 MVP 不需要 SSO/组织/GDPR/演示等模块。v3 将 P2-P3 端点标记为"推迟"，MVP 聚焦 70 个核心端点。

| 优先级 | 模块 | 端点数 | 说明 |
|--------|------|--------|------|
| **P0 — MVP 必须** | 健康、认证、项目、搜索、工作流、消息、WebSocket、SSE | ~50 | 核心流程闭环 |
| **P0 — MVP 必须** | Agent、产出物、用量 | ~20 | Agent 协作 + 成本追踪 |
| **P1 — 尽快** | 提示词、审核、设置、密钥 | ~25 | 质量保障 + 配置管理 |
| **P2 — 推迟** | 评估、插件、审计、Webhook | ~20 | 有早期用户反馈后再做 |
| **P3 — 远期** | 通知、数据(GDPR)、组织、SSO、演示 | ~15 | SaaS 阶段才需要 |

### P3 模块推迟说明

| 模块 | 推迟原因 |
|------|---------|
| 组织 (8端点) | 桌面应用无多租户场景 |
| SSO (3端点) | 桌面应用本地认证即可 |
| 数据/GDPR (3端点) | 数据存本地 SQLite，用户可直接访问文件 |
| 演示 (2端点) | 可用文档/视频替代 |
| 通知 (4端点) | 系统通知即可，邮件/飞书后续集成 |

**MVP 总端点：~70（从 124 缩减 43%）**

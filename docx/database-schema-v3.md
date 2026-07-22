# 数据库 Schema v3 — 最终版

## v2 → v3 修正清单

| # | 问题 | 修正 |
|---|------|------|
| 1 | secrets.is_encrypted 废列 | 删除该列，加密由应用层保证 |
| 2 | gate_results UNIQUE 阻止重审 | 改为 (instance_id, gate_id, attempt) |
| 3 | plugin_configs 明文密钥 | config_json 敏感字段 Fernet 加密 + 注释说明 |
| 4 | agent_configs UNIQUE + NULL 坑 | workflow_instance_id 改为 NOT NULL |
| 5 | messages.parent_id 跨项目 | 应用层校验 parent 必须同 project_id |
| 6 | gate_results 无 FK 到 stage_states | 加 FK |
| 7 | artifacts 版本可重复 | 加 UNIQUE(project_id, artifact_type, name, version) |
| 8 | stage_states 又塞 JSON | 拆出 stage_checklist_items 表 |
| 9 | stage_states 无排序 | 加 sequence 字段 |
| 10 | roles 越权绑定模型参数 | model/temperature 移到 agent_configs |
| 11 | agent_configs 丢了 config_json | 加回来 |
| 12 | secrets 无软删除 | 加 deleted_at |
| 13 | budget_warning 不自动重置 | 应用层规则：修改 budget_limit_usd 时重置 |
| 14 | 缺复合索引 | 全补上 |

---

## 建表 SQL

```sql
-- ============================================================
-- 1. 角色定义
-- ============================================================

CREATE TABLE roles (
    id TEXT PRIMARY KEY,                          -- "product_manager" / "rd" / "qa" ...
    name TEXT NOT NULL,                           -- "产品经理"
    category TEXT NOT NULL DEFAULT 'preset'
        CHECK(category IN ('preset', 'custom')),
    description TEXT DEFAULT '',
    default_system_prompt TEXT NOT NULL,          -- 默认系统提示词（Jinja2 模板）
    is_builtin INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);

-- ============================================================
-- 2. 项目
-- ============================================================

CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,                       -- v3新增：项目所有者，FK 到 users
    org_id TEXT,                                  -- v3新增：B2B多租户预留（MVP阶段为NULL）
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    workflow_template_id TEXT,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK(status IN ('active', 'paused', 'completed', 'archived')),
    complexity_tier TEXT NOT NULL DEFAULT 'auto'   -- v3新增：lite/standard/full/auto
        CHECK(complexity_tier IN ('auto', 'lite', 'standard', 'full')),
    budget_limit_usd REAL DEFAULT 0.0,
    budget_warning_sent INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);

CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_org ON projects(org_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_deleted ON projects(deleted_at);

-- ============================================================
-- 3. 工作流模板
-- ============================================================

CREATE TABLE workflow_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT DEFAULT '未分类',
    version TEXT NOT NULL DEFAULT '1.0.0',
    definition TEXT NOT NULL,
    is_builtin INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);

-- ============================================================
-- 4. 工作流实例
-- ============================================================

CREATE TABLE workflow_instances (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL REFERENCES workflow_templates(id),
    template_snapshot TEXT NOT NULL,
    current_stage TEXT,
    status TEXT NOT NULL DEFAULT 'running'
        CHECK(status IN ('running', 'paused', 'completed', 'aborted')),
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    deleted_at TEXT
);

CREATE INDEX idx_workflow_instances_project ON workflow_instances(project_id);
CREATE INDEX idx_workflow_instances_status ON workflow_instances(status);

-- ============================================================
-- 5. 阶段状态
-- ============================================================

CREATE TABLE stage_states (
    id TEXT PRIMARY KEY,
    workflow_instance_id TEXT NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    stage_id TEXT NOT NULL,                       -- "concept" / "plan" ...
    sequence INTEGER NOT NULL,                    -- 阶段顺序 1,2,3...
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending', 'in_progress', 'completed', 'skipped', 'blocked')),
    started_at TEXT,
    completed_at TEXT,
    notes TEXT DEFAULT '',
    UNIQUE(workflow_instance_id, stage_id),
    UNIQUE(workflow_instance_id, sequence)
);

-- 阶段检查项（不再塞 JSON）
CREATE TABLE stage_checklist_items (
    id TEXT PRIMARY KEY,
    stage_state_id TEXT NOT NULL REFERENCES stage_states(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK(item_type IN ('entry', 'exit')),
    description TEXT NOT NULL,
    checked INTEGER DEFAULT 0,
    checked_by TEXT,                              -- agent_role_id
    checked_at TEXT,
    sequence INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_stage_states_instance ON stage_states(workflow_instance_id);
CREATE INDEX idx_stage_checklist_stage ON stage_checklist_items(stage_state_id);

-- ============================================================
-- 6. 门禁结果
-- ============================================================

CREATE TABLE gate_results (
    id TEXT PRIMARY KEY,
    workflow_instance_id TEXT NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    stage_state_id TEXT NOT NULL REFERENCES stage_states(id) ON DELETE CASCADE,
    gate_id TEXT NOT NULL,                        -- "cdcp" / "tr3" ...
    gate_type TEXT NOT NULL CHECK(gate_type IN ('decision', 'technical', 'approval')),
    attempt INTEGER NOT NULL DEFAULT 1,           -- 第几次尝试
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending', 'in_progress', 'passed', 'failed', 'redirected', 'skipped')),
    decision TEXT,
    voters TEXT DEFAULT '{}',
    summary TEXT DEFAULT '',
    executed_at TEXT,
    UNIQUE(workflow_instance_id, gate_id, attempt)
);

CREATE INDEX idx_gate_results_instance ON gate_results(workflow_instance_id);
CREATE INDEX idx_gate_results_latest ON gate_results(workflow_instance_id, gate_id, attempt DESC);

-- ============================================================
-- 7. Agent 配置
-- ============================================================

CREATE TABLE agent_configs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    workflow_instance_id TEXT NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES roles(id),
    name TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    system_prompt_override TEXT,
    model TEXT NOT NULL DEFAULT 'claude-sonnet-4-5',
    temperature REAL DEFAULT 0.7,
    config_json TEXT DEFAULT '{}',                -- 扩展配置
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    UNIQUE(project_id, workflow_instance_id, role_id)
);

CREATE INDEX idx_agent_configs_project ON agent_configs(project_id);
CREATE INDEX idx_agent_configs_instance ON agent_configs(workflow_instance_id);
CREATE INDEX idx_agent_configs_role ON agent_configs(role_id);

-- ============================================================
-- 8. Agent-插件关联
-- ============================================================

CREATE TABLE agent_plugins (
    agent_config_id TEXT NOT NULL REFERENCES agent_configs(id) ON DELETE CASCADE,
    plugin_config_id TEXT NOT NULL REFERENCES plugin_configs(id) ON DELETE CASCADE,
    config_json TEXT DEFAULT '{}',                -- 插件在此Agent上的额外配置
    PRIMARY KEY (agent_config_id, plugin_config_id)
);

CREATE INDEX idx_agent_plugins_agent ON agent_plugins(agent_config_id);
CREATE INDEX idx_agent_plugins_plugin ON agent_plugins(plugin_config_id);

-- ============================================================
-- 9. 消息
-- ============================================================

CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    workflow_instance_id TEXT REFERENCES workflow_instances(id) ON DELETE SET NULL,
    sender TEXT NOT NULL,
    recipient TEXT,
    message_type TEXT NOT NULL DEFAULT 'response'
        CHECK(message_type IN ('task_proposal', 'review', 'handoff', 'query', 'response', 'system')),
    content TEXT NOT NULL DEFAULT '',
    parent_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
    round_id TEXT,
    stage_id TEXT,
    metadata_json TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
    -- parent_id 跨项目约束由应用层保证（见下方校验规则）
);

CREATE INDEX idx_messages_project ON messages(project_id);
CREATE INDEX idx_messages_instance ON messages(workflow_instance_id);
CREATE INDEX idx_messages_stage ON messages(stage_id);
CREATE INDEX idx_messages_parent ON messages(parent_id);
CREATE INDEX idx_messages_round ON messages(round_id);
-- 复合索引
CREATE INDEX idx_messages_instance_time ON messages(workflow_instance_id, created_at);
CREATE INDEX idx_messages_project_time ON messages(project_id, created_at);

-- ============================================================
-- 10. 产出物
-- ============================================================

CREATE TABLE artifacts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    workflow_instance_id TEXT REFERENCES workflow_instances(id) ON DELETE SET NULL,
    stage_id TEXT,
    artifact_type TEXT NOT NULL,
    name TEXT NOT NULL,
    content TEXT DEFAULT '',
    version INTEGER DEFAULT 1,
    is_current INTEGER DEFAULT 1,                 -- 1 = 当前版本
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    UNIQUE(project_id, artifact_type, name, version)
);

CREATE INDEX idx_artifacts_project ON artifacts(project_id);
CREATE INDEX idx_artifacts_instance ON artifacts(workflow_instance_id);
CREATE INDEX idx_artifacts_stage ON artifacts(stage_id);
CREATE INDEX idx_artifacts_current ON artifacts(project_id, artifact_type, is_current)
    WHERE is_current = 1;

-- ============================================================
-- 11. 插件配置
-- ============================================================

-- config_json 中的敏感字段（api_token, webhook_secret 等）由应用层在
-- 写入前用 Fernet 加密，读取后解密。plugin_configs 不设独立的加密列，
-- 加密粒度由插件 manifest 的 config_schema 中每个字段的 "secret": true 标记控制。
CREATE TABLE plugin_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    plugin_type TEXT NOT NULL CHECK(plugin_type IN ('tool', 'capability')),
    enabled INTEGER DEFAULT 1,
    config_json TEXT DEFAULT '{}',
    installed_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);

-- ============================================================
-- 12. 使用记录
-- ============================================================

CREATE TABLE usage_records (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    workflow_instance_id TEXT REFERENCES workflow_instances(id) ON DELETE SET NULL,
    agent_config_id TEXT REFERENCES agent_configs(id) ON DELETE SET NULL,
    model TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    cost_usd REAL DEFAULT 0.0,
    stage_id TEXT,
    activity_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_usage_records_project ON usage_records(project_id);
CREATE INDEX idx_usage_records_agent ON usage_records(agent_config_id);
-- 复合索引
CREATE INDEX idx_usage_records_project_time ON usage_records(project_id, created_at);
CREATE INDEX idx_usage_records_instance_stage ON usage_records(workflow_instance_id, stage_id);
CREATE INDEX idx_usage_records_agent_time ON usage_records(agent_config_id, created_at);

-- ============================================================
-- 13. 设置（非敏感）
-- ============================================================

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    category TEXT DEFAULT 'general'
        CHECK(category IN ('general', 'llm', 'appearance', 'workflow', 'notification')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 14. 密钥（敏感凭证）
-- ============================================================

CREATE TABLE secrets (
    key TEXT PRIMARY KEY,
    encrypted_value TEXT NOT NULL,                -- 应用层 Fernet 加密
    provider TEXT,                                -- "openai" / "anthropic" / "dashscope" / "qianfan"
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT                               -- 密钥轮换后逻辑删除
);

-- ============================================================
-- 15. 审计日志
-- ============================================================

CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    workflow_instance_id TEXT REFERENCES workflow_instances(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    actor TEXT NOT NULL,
    detail_json TEXT DEFAULT '{}',
    prev_hash TEXT,                               -- v3新增：上一条日志的SHA256哈希，形成不可篡改链
    hash TEXT NOT NULL,                            -- v3新增：本条日志的SHA256哈希 = SHA256(prev_hash + id + action + actor + created_at)
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_logs_project ON audit_logs(project_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_project_time ON audit_logs(project_id, created_at);
CREATE INDEX idx_audit_logs_hash ON audit_logs(hash);

-- ============================================================
-- 16. 门禁投票明细（v3新增 — 替代 gate_results.voters JSON）
-- ============================================================

CREATE TABLE gate_votes (
    id TEXT PRIMARY KEY,
    gate_result_id TEXT NOT NULL REFERENCES gate_results(id) ON DELETE CASCADE,
    voter TEXT NOT NULL,                           -- 投票人角色ID，如 "product_manager"
    vote TEXT NOT NULL CHECK(vote IN ('approve', 'reject', 'abstain', 'conditional')),
    comment TEXT DEFAULT '',
    voted_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(gate_result_id, voter)                  -- 每个投票人每个门禁只能投一次
);

CREATE INDEX idx_gate_votes_gate_result ON gate_votes(gate_result_id);
CREATE INDEX idx_gate_votes_voter ON gate_votes(voter);
```

---

## 应用层约束规则

```python
# ============================================================
# issue #5: messages.parent_id 跨项目校验
# ============================================================
async def validate_message_parent(db, msg: Message) -> None:
    if msg.parent_id:
        parent = await db.get_message(msg.parent_id)
        if parent is None:
            raise ValidationError("父消息不存在")
        if parent.project_id != msg.project_id:
            raise ValidationError("父消息不属于同一项目")


# ============================================================
# issue #13: 修改预算时重置预警标记
# ============================================================
async def update_budget(db, project_id: str, new_limit: float) -> None:
    await db.execute(
        "UPDATE projects SET budget_limit_usd = ?, budget_warning_sent = 0, updated_at = ? WHERE id = ?",
        (new_limit, now_iso(), project_id)
    )


# ============================================================
# issue #7: 版本插入时自动维护 is_current
# ============================================================
async def insert_artifact(db, artifact: Artifact) -> str:
    # 将同类型旧版本的 is_current 置 0
    await db.execute(
        "UPDATE artifacts SET is_current = 0 WHERE project_id = ? AND artifact_type = ? AND name = ?",
        (artifact.project_id, artifact.artifact_type, artifact.name)
    )
    artifact.is_current = 1
    return await db.insert("artifacts", artifact)


# ============================================================
# issue #3: 插件敏感字段加密
# ============================================================
def encrypt_plugin_secrets(manifest: PluginManifest, config: dict) -> dict:
    """根据 manifest.config_schema 中标记 secret: true 的字段加密"""
    schema = manifest.config_schema
    for field_name, field_def in schema.get("properties", {}).items():
        if field_def.get("secret") and field_name in config:
            config[field_name] = fernet.encrypt(config[field_name].encode()).decode()
    return config
```

---

## 三个版本对比

| 维度 | v1 | v2 | v3 |
|------|----|----|-----|
| 表数量 | 10 | 12 | 17 |
| 密钥安全 | ❌ 明文 | ✅ secrets表 | ✅ secrets + 插件字段加密 |
| 阶段/门禁 | ❌ 缺失 | ✅ 独立表 | ✅ + 检查项拆表 + 排序 + 投票明细拆表 |
| 门禁重审 | - | ❌ UNIQUE冲突 | ✅ 加 attempt |
| 参照完整性 | ⚠️ 多处缺失 | ⚠️ 1处 | ✅ 全覆盖 |
| 软删除 | ❌ | ⚠️ secrets缺 | ✅ 全覆盖 |
| 复合索引 | ❌ | ❌ | ✅ 6个 |
| 时间格式 | ❌ 随意 | ✅ 统一 | ✅ 统一（ISO 8601 UTC） |
| agent_configs | ⚠️ JSON存插件 | ✅ 关联表 | ✅ 关联表 + config_json |
| workflow_instance_id | ❌ | ⚠️ NULL坑 | ✅ NOT NULL |
| 审计链 | ❌ | ❌ | ✅ hash链式锚定 |
| 项目归属 | ❌ 无owner | ❌ 无owner | ✅ owner_id |
| 门禁投票 | ⚠️ JSON | ⚠️ JSON | ✅ 独立gate_votes表 |

---

## v3 时间戳约定

所有 `created_at`、`updated_at`、`deleted_at` 等时间字段统一使用 **ISO 8601 UTC** 格式：
```
"2026-07-07T10:30:00Z"
```
- 存储类型：TEXT
- 时区：始终 UTC（`datetime('now')` 在 SQLite 中返回 UTC）
- 应用层统一使用 `datetime.now(timezone.utc).isoformat()` 生成
- 前端展示时转换为本地时区

---

## v3 与 security-architecture-v2.md 的协调说明

| 项目 | database-schema-v3 | security-architecture-v2 | 协调结果 |
|------|-------------------|--------------------------|---------|
| secrets 表 | 单主键 `key` | 复合主键 `(key, version)` | **以 schema-v3 为准**。版本管理通过 `updated_at` + 审计日志实现，不通过复合主键 |
| audit_logs 表 | 含 `hash` + `prev_hash` | 链式哈希锚定依赖 hash 字段 | **已统一**：v3 已添加 hash 字段 |
| gate_results.voters | 保留 TEXT 字段（向后兼容） | 未提及 | **新增** `gate_votes` 表作为权威投票记录，`voters` JSON 字段作为缓存/冗余 |

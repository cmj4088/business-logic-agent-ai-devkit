-- v001: 初始数据库表结构（17 张表）

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 会话表
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 加密密钥表
CREATE TABLE IF NOT EXISTS secrets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    key_name TEXT NOT NULL,
    encrypted_value TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);

-- 工作流模板表
CREATE TABLE IF NOT EXISTS workflow_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    template_data TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 工作流实例表
CREATE TABLE IF NOT EXISTS workflow_instances (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL REFERENCES workflow_templates(id),
    project_id TEXT NOT NULL,
    instance_data TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 项目表
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    complexity_tier TEXT NOT NULL DEFAULT 'auto',
    current_stage TEXT NOT NULL DEFAULT 'concept',
    status TEXT NOT NULL DEFAULT 'active',
    progress REAL NOT NULL DEFAULT 0,
    template_id TEXT NOT NULL,
    budget_limit REAL NOT NULL DEFAULT 0,
    team_size INTEGER NOT NULL DEFAULT 1,
    target_weeks INTEGER NOT NULL DEFAULT 8,
    industry TEXT NOT NULL DEFAULT '其他',
    deleted_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 阶段状态表
CREATE TABLE IF NOT EXISTS stage_states (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    stage TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 阶段检查项表
CREATE TABLE IF NOT EXISTS stage_checklist_items (
    id TEXT PRIMARY KEY,
    stage_state_id TEXT NOT NULL REFERENCES stage_states(id),
    item_key TEXT NOT NULL,
    description TEXT NOT NULL,
    is_blocking INTEGER NOT NULL DEFAULT 1,
    is_completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 门禁结果表
CREATE TABLE IF NOT EXISTS gate_results (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    stage TEXT NOT NULL,
    gate_id TEXT NOT NULL,
    attempt INTEGER NOT NULL DEFAULT 1,
    voter_role TEXT NOT NULL,
    vote TEXT NOT NULL DEFAULT 'pending',
    comment TEXT DEFAULT '',
    is_auto_approved INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 审核任务表
CREATE TABLE IF NOT EXISTS review_tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    gate_id TEXT NOT NULL,
    artifact_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    auto_approved INTEGER NOT NULL DEFAULT 0,
    assigned_to TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 审核问题表
CREATE TABLE IF NOT EXISTS review_issues (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    gate_id TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT
);

-- 活动状态表
CREATE TABLE IF NOT EXISTS activity_states (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    stage TEXT NOT NULL,
    activity_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 产出物表
CREATE TABLE IF NOT EXISTS artifacts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    artifact_type TEXT NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    version INTEGER NOT NULL DEFAULT 1,
    stage TEXT NOT NULL,
    ai_metadata TEXT DEFAULT '{}',
    deleted_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 产出物版本表
CREATE TABLE IF NOT EXISTS artifact_versions (
    id TEXT PRIMARY KEY,
    artifact_id TEXT NOT NULL REFERENCES artifacts(id),
    version INTEGER NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 附件表
CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    artifact_id TEXT NOT NULL REFERENCES artifacts(id),
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    size INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 插件配置表
CREATE TABLE IF NOT EXISTS plugin_configs (
    id TEXT PRIMARY KEY,
    plugin_id TEXT NOT NULL,
    name TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0.0',
    enabled INTEGER NOT NULL DEFAULT 0,
    config_json TEXT DEFAULT '{}',
    installed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 插件工具注册表
CREATE TABLE IF NOT EXISTS plugin_tools (
    id TEXT PRIMARY KEY,
    plugin_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    tool_schema TEXT NOT NULL
);

-- 用量记录表
CREATE TABLE IF NOT EXISTS usage_records (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 用量限制表
CREATE TABLE IF NOT EXISTS usage_limits (
    id TEXT PRIMARY KEY,
    limit_type TEXT NOT NULL,
    max_tokens INTEGER NOT NULL,
    period TEXT NOT NULL DEFAULT 'monthly',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
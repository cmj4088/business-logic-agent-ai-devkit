-- v003: 添加 Agent 协作和消息系统所需表
-- 新增: roles, agent_configs, messages, settings

-- ============================================================
-- 1. 角色定义表（6 个 IPD Agent 角色）
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'preset'
        CHECK(category IN ('preset', 'custom')),
    description TEXT DEFAULT '',
    default_system_prompt TEXT NOT NULL DEFAULT '',
    is_builtin INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);

-- 插入 6 个预设角色
INSERT OR IGNORE INTO roles (id, name, category, description, is_builtin) VALUES
    ('product_manager', '产品经理', 'preset', '需求分析、MRD/PRD、门禁决策', 1),
    ('rd', '研发架构师', 'preset', '技术评估、系统设计、TR 评审', 1),
    ('qa', '测试专家', 'preset', '测试策略、用例编写、质量评估', 1),
    ('marketing', '市场专家', 'preset', '竞品分析、GTM 计划、定价', 1),
    ('manufacturing', '制造工程师', 'preset', 'BOM 估算、DFM 审查、供应链', 1),
    ('finance', '财务分析师', 'preset', '商业论证、成本核算、ROI 预测', 1);

-- ============================================================
-- 2. 消息表（Agent 对话 + 用户消息）
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    recipient TEXT,
    message_type TEXT NOT NULL DEFAULT 'response'
        CHECK(message_type IN ('task_proposal', 'review', 'handoff', 'query', 'response', 'system')),
    content TEXT NOT NULL DEFAULT '',
    parent_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
    round_id TEXT,
    stage TEXT,
    metadata_json TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_project ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_stage ON messages(stage);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_messages_round ON messages(round_id);
CREATE INDEX IF NOT EXISTS idx_messages_project_time ON messages(project_id, created_at);

-- ============================================================
-- 3. Agent 配置表（每个项目可单独配置 Agent 模型和参数）
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_configs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES roles(id),
    name TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    system_prompt_override TEXT,
    model TEXT NOT NULL DEFAULT 'qwen2.5:7b',
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 32000,
    config_json TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    UNIQUE(project_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_configs_project ON agent_configs(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_role ON agent_configs(role_id);

-- ============================================================
-- 4. 设置表（非敏感配置，如主题、语言、默认LLM后端）
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    category TEXT DEFAULT 'general'
        CHECK(category IN ('general', 'llm', 'appearance', 'workflow', 'notification')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 插入默认设置
INSERT OR IGNORE INTO settings (key, value, category) VALUES
    ('default_backend', 'ollama', 'llm'),
    ('ollama_url', 'http://localhost:11434', 'llm'),
    ('default_model', 'qwen2.5:7b', 'llm'),
    ('theme', 'auto', 'appearance'),
    ('language', 'zh-CN', 'general'),
    ('auto_update', 'true', 'general'),
    ('budget_alert_threshold', '50', 'general'),
    ('budget_alert_enabled', 'true', 'general');
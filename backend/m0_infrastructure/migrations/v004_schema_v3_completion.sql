-- v004: 补全 schema v3 缺失表 — agent_plugins, audit_logs, gate_votes
-- 说明：schema v3 共 17 张表，v001-v003 已建 14 张，本迁移补全剩余 3 张

-- ============================================================
-- 1. Agent 插件关联表（多对多：agent_configs ↔ plugin_configs）
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_plugins (
    agent_config_id TEXT NOT NULL REFERENCES agent_configs(id) ON DELETE CASCADE,
    plugin_config_id TEXT NOT NULL REFERENCES plugin_configs(id) ON DELETE CASCADE,
    config_json TEXT DEFAULT '{}',
    PRIMARY KEY (agent_config_id, plugin_config_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_plugins_agent ON agent_plugins(agent_config_id);
CREATE INDEX IF NOT EXISTS idx_agent_plugins_plugin ON agent_plugins(plugin_config_id);

-- ============================================================
-- 2. 审计日志表（不可篡改链 — SHA256 哈希链接）
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    workflow_instance_id TEXT REFERENCES workflow_instances(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    actor TEXT NOT NULL,
    detail_json TEXT DEFAULT '{}',
    prev_hash TEXT,
    hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_project ON audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project_time ON audit_logs(project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_hash ON audit_logs(hash);

-- ============================================================
-- 3. 门禁投票明细表（替代 gate_results 中的 JSON 投票数据）
-- ============================================================
CREATE TABLE IF NOT EXISTS gate_votes (
    id TEXT PRIMARY KEY,
    gate_result_id TEXT NOT NULL REFERENCES gate_results(id) ON DELETE CASCADE,
    voter TEXT NOT NULL,
    vote TEXT NOT NULL CHECK(vote IN ('approve', 'reject', 'abstain', 'conditional')),
    comment TEXT DEFAULT '',
    voted_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(gate_result_id, voter)
);

CREATE INDEX IF NOT EXISTS idx_gate_votes_gate_result ON gate_votes(gate_result_id);
CREATE INDEX IF NOT EXISTS idx_gate_votes_voter ON gate_votes(voter);
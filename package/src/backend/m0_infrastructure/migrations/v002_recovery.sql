-- v002: 添加 M10 异常恢复模块表

-- 恢复动作记录表
CREATE TABLE IF NOT EXISTS recovery_actions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    action_type TEXT NOT NULL,
    params TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'in_progress',
    result TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 恢复动作索引
CREATE INDEX IF NOT EXISTS idx_recovery_actions_project ON recovery_actions(project_id);
CREATE INDEX IF NOT EXISTS idx_recovery_actions_status ON recovery_actions(status);
CREATE INDEX IF NOT EXISTS idx_recovery_actions_created ON recovery_actions(created_at);
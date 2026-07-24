-- v006 补全缺失的 pending_items 和 notifications 表
-- v005 迁移已记录但这两个表未实际创建，此迁移补齐

-- 待处理事项表（Dashboard 使用）
CREATE TABLE IF NOT EXISTS pending_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    priority TEXT DEFAULT 'medium',
    type TEXT NOT NULL DEFAULT 'review',
    project_id TEXT,
    project_name TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    auto_completed INTEGER NOT NULL DEFAULT 0,
    waiting_since TEXT DEFAULT '',
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 通知表（Dashboard 使用）
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT DEFAULT '',
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
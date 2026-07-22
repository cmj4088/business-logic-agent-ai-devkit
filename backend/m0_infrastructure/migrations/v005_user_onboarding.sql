-- v005 集成测试补全迁移
-- 添加缺失的 user_onboarding、pending_items、notifications 表

-- 用户引导状态表
CREATE TABLE IF NOT EXISTS user_onboarding (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id),
    completed_steps TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

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
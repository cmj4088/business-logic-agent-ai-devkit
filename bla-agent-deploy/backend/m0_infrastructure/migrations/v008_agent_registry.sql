-- v008: Agent Registry — 独立智能体注册表
-- 用于持久化注册的远程独立 Agent 信息
-- 创建时间: 2026-07-25

CREATE TABLE IF NOT EXISTS agent_registry (
    id TEXT PRIMARY KEY,                          -- 注册记录 ID
    role TEXT NOT NULL UNIQUE,                    -- Agent 角色（product_manager/rd/qa/marketing/manufacturing/finance）
    url TEXT NOT NULL,                            -- Agent 服务 URL
    name TEXT NOT NULL,                           -- 显示名称
    manifest_json TEXT NOT NULL DEFAULT '{}',     -- Agent 清单（JSON）
    is_active INTEGER DEFAULT 1,                 -- 是否激活
    registered_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_heartbeat_at TEXT,                       -- 最近心跳时间
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_agent_registry_role ON agent_registry(role);
CREATE INDEX idx_agent_registry_active ON agent_registry(is_active);

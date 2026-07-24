# backend/m0_infrastructure/migrations/v004_schema_v3_completion.sql — Schema v3 补全迁移

## 概述
第四次数据库迁移，补全 schema v3 中缺失的 3 张表：Agent 插件关联表、审计日志表和门禁投票明细表。至此 schema v3 全部 17 张表均已通过迁移覆盖。

## 新建表详细说明

### agent_plugins — Agent 插件关联表
- **功能**: Agent 配置与插件配置的多对多关联
- **字段**:
  - `agent_config_id` (TEXT NOT NULL): Agent 配置 ID，外键引用 agent_configs(id)
  - `plugin_config_id` (TEXT NOT NULL): 插件配置 ID，外键引用 plugin_configs(id)
  - `config_json` (TEXT DEFAULT '{}'): 插件在特定 Agent 上的额外配置
  - **联合主键**: (agent_config_id, plugin_config_id)
- **索引**: `idx_agent_plugins_agent`, `idx_agent_plugins_plugin`
- **级联删除**: 两端均 ON DELETE CASCADE

### audit_logs — 审计日志表（不可篡改链）
- **功能**: 记录所有关键操作，通过 SHA256 哈希链保证不可篡改
- **字段**:
  - `id` (TEXT PRIMARY KEY): 日志唯一标识
  - `project_id` (TEXT): 所属项目 ID（可空，SET NULL on delete）
  - `workflow_instance_id` (TEXT): 工作流实例 ID
  - `action` (TEXT NOT NULL): 操作名称
  - `actor` (TEXT NOT NULL): 操作者
  - `detail_json` (TEXT DEFAULT '{}'): 操作详情 JSON
  - `prev_hash` (TEXT): 上一条日志的 SHA256 哈希
  - `hash` (TEXT NOT NULL): 本条日志的 SHA256 哈希
  - `created_at` (TEXT NOT NULL): 创建时间
- **安全机制**: hash = SHA256(prev_hash + id + action + actor + created_at)
- **索引**: `idx_audit_logs_project`, `idx_audit_logs_created`, `idx_audit_logs_project_time`, `idx_audit_logs_hash`

### gate_votes — 门禁投票明细表
- **功能**: 替代 gate_results 中的 JSON 投票数据，提供结构化投票记录
- **字段**:
  - `id` (TEXT PRIMARY KEY): 投票唯一标识
  - `gate_result_id` (TEXT NOT NULL): 门禁结果 ID，外键引用 gate_results(id)
  - `voter` (TEXT NOT NULL): 投票人角色 ID
  - `vote` (TEXT NOT NULL): 投票类型（approve/reject/abstain/conditional）
  - `comment` (TEXT DEFAULT ''): 投票备注
  - `voted_at` (TEXT NOT NULL): 投票时间
  - **唯一约束**: UNIQUE(gate_result_id, voter) — 每人每个门禁只能投一次
- **索引**: `idx_gate_votes_gate_result`, `idx_gate_votes_voter`

## 依赖关系
- 依赖 v001 中的 `projects`, `workflow_instances`, `gate_results`, `plugin_configs` 表
- 依赖 v003 中的 `agent_configs` 表

## 注意事项
- 所有表使用 `CREATE TABLE IF NOT EXISTS` 保证幂等
- 审计日志的哈希链由应用层计算和维护
- gate_votes 与 gate_results 是一对多关系（一个门禁有多人投票）
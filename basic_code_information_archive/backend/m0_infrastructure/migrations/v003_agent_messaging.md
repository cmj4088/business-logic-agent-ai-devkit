# backend/m0_infrastructure/migrations/v003_agent_messaging.sql — Agent 消息系统数据库迁移

## 概述
第三次数据库迁移，新增 4 张表支持 Agent 对话系统：角色定义表、消息记录表、Agent 配置表和应用设置表。所有表使用 `IF NOT EXISTS` 保证幂等性。

## 新建表详细说明

### roles — IPD Agent 角色定义表
- **功能**: 定义系统中 6 个 IPD Agent 角色的基本信息
- **字段**:
  - `id` (TEXT PRIMARY KEY): 角色唯一标识，如 `product_manager`, `rd`, `qa`
  - `name` (TEXT NOT NULL): 角色中文名，如"产品经理"
  - `display_name` (TEXT): 角色显示名称
  - `description` (TEXT): 角色职责描述
  - `avatar` (TEXT): 角色头像标识
  - `created_at` (TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)
- **预设数据**: 6 个角色（产品经理小王、研发架构师老张、测试专家、市场专家、制造工程师、财务分析师）
- **索引**: `idx_roles_name`

### messages — Agent 对话消息表
- **功能**: 存储所有 Agent 对话消息，支持多轮辩论
- **字段**:
  - `id` (TEXT PRIMARY KEY): 消息唯一标识
  - `project_id` (TEXT NOT NULL): 所属项目 ID
  - `sender` (TEXT NOT NULL): 发送者角色 ID
  - `sender_label` (TEXT): 发送者显示名称
  - `message_type` (TEXT NOT NULL DEFAULT 'response'): 消息类型（user_prompt/response/system）
  - `content` (TEXT NOT NULL): 消息内容
  - `stage` (TEXT): 所属阶段
  - `parent_id` (TEXT): 父消息 ID（支持多轮辩论线程）
  - `created_at` (TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)
- **索引**: `idx_messages_project`, `idx_messages_stage`, `idx_messages_parent`

### agent_configs — Agent 配置表
- **功能**: 每个项目独立的 Agent 模型和参数配置
- **字段**:
  - `id` (TEXT PRIMARY KEY): 配置唯一标识
  - `project_id` (TEXT NOT NULL): 所属项目 ID
  - `agent_role` (TEXT NOT NULL): Agent 角色 ID
  - `model` (TEXT NOT NULL DEFAULT 'ollama'): 使用的 LLM 模型
  - `temperature` (REAL DEFAULT 0.7): 生成温度
  - `max_tokens` (INTEGER DEFAULT 2048): 最大 Token 数
  - `system_prompt` (TEXT): 自定义系统提示词
  - `is_active` (INTEGER DEFAULT 1): 是否启用
  - `created_at` / `updated_at`: 时间戳
  - **唯一约束**: `uq_agent_configs_project_role` (project_id, agent_role)
- **索引**: `idx_agent_configs_project`

### settings — 应用级设置表
- **功能**: 存储应用全局设置，键值对模式
- **字段**:
  - `key` (TEXT PRIMARY KEY): 设置键名
  - `value` (TEXT NOT NULL): 设置值（JSON 字符串）
  - `description` (TEXT): 设置说明
  - `updated_at` (TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)
- **预设数据**:
  - `llm_backend`: 默认 LLM 后端（ollama）
  - `theme`: 默认主题（system）
  - `budget_alert_threshold`: 预算告警阈值（80%）
  - `max_debate_rounds`: 最大辩论轮次（5）
  - `auto_advance_stage`: 是否自动推进阶段（false）

## 依赖关系
- 依赖 v001（基础表）和 v002 中已存在的 `projects` 表
- `messages.project_id` 外键引用 `projects.id`
- `agent_configs.project_id` 外键引用 `projects.id`

## 注意事项
- 所有表使用 `IF NOT EXISTS` 保证幂等迁移
- 预设数据使用 `INSERT OR IGNORE` 避免重复插入
- 消息表 `parent_id` 支持树形对话结构，可用于多轮辩论
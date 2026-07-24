# v005_user_onboarding.sql — 用户引导与 Dashboard 表

## 位置
`backend/m0_infrastructure/migrations/v005_user_onboarding.sql`

## 作用
第五个数据库迁移，新增 3 张表：
1. `user_onboarding` — 用户引导状态（记录首次访问和完成步骤）
2. `pending_items` — 待处理事项表（Dashboard 使用，含 description/priority/project_id/waiting_since 等字段）
3. `notifications` — 通知表（Dashboard 使用，含 message 字段）

## 表结构
- `pending_items`: id, user_id, title, description, priority, type, project_id, project_name, status, auto_completed, waiting_since, completed_at, created_at
- `notifications`: id, user_id, type, title, message, is_read, created_at

## 更新记录
- 2026-07-09：补充了 description、priority、project_id、project_name、waiting_since、message 字段以匹配前端 Dashboard 类型
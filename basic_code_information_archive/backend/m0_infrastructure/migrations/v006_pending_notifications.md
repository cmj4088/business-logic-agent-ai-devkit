# v006_pending_notifications.sql — 补全缺失表

## 位置
`backend/m0_infrastructure/migrations/v006_pending_notifications.sql`

## 作用
第六个数据库迁移，补全 v005 中已记录但未实际创建的 `pending_items` 和 `notifications` 表。

## 背景
v005 迁移记录已在 `_migrations` 表中，但 `pending_items` 和 `notifications` 表因数据库重建而丢失。由于 `CREATE TABLE IF NOT EXISTS` 在 v005 中已执行但被跳过，故创建 v006 显式创建这两张表。

## 表结构
与 v005 相同，使用 `CREATE TABLE IF NOT EXISTS`：
- `pending_items`: 含 description, priority, project_id, project_name, waiting_since 等完整字段
- `notifications`: 含 message 字段

## 创建时间
2026-07-09（第二十步 — 端到端验证与 Bug 修复）
# settings_router.py — 设置与数据管理路由

## 文件位置
`backend/m0_infrastructure/settings_router.py`

## 功能概述
提供全局设置、数据导出/清除、用户引导等端点。属于 M0 基础设施，不关联特定业务模块。

## API 端点

### 用户引导（M14a 调用）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/user/onboarding` | 获取用户引导状态（isFirstVisit、completedSteps） |
| POST | `/api/user/onboarding/complete` | 标记引导步骤完成（body: {step_id}） |

### 全局设置（M18 调用）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/settings` | 获取全局设置（theme、language、autoAdvanceStage 等） |
| PUT | `/api/settings` | 更新全局设置（body: {theme, language, ...}） |

设置项：
- `theme`: 主题（system/light/dark）
- `language`: 语言（zh-CN/en）
- `autoAdvanceStage`: 是否自动推进阶段
- `maxDebateRounds`: 最大辩论轮次
- `notificationEnabled`: 是否启用通知
- `defaultLLMBackend`: 默认 LLM 后端

### 数据管理（M18 调用）
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/data/export` | 导出用户数据（GDPR 合规） |
| POST | `/api/data/clear` | 清除所有用户数据（需确认短语"确认清除所有数据"） |

## 数据存储
- 设置数据存储在 `settings` 表（KV 结构，使用 UPSERT 语义）
- 引导数据存储在 `user_onboarding` 表（v005 迁移创建）
- 数据清除使用软删除（设置 deleted_at 时间戳）

## 注册方式
在 `main.py` 的 `create_app()` 中通过 `app.include_router(settings_router)` 注册。
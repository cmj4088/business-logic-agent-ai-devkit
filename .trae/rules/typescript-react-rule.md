---
description: TypeScript/React 前端开发规范 — Ant Design、Zustand、Electron
glob: "frontend/**/*.{ts,tsx}"
---

# TypeScript / React 前端开发规范

## 技术栈
- **框架**: React 18 + TypeScript (strict)
- **UI 库**: Ant Design 5.x
- **状态管理**: Zustand
- **构建**: Vite

## 前端模块结构（M11-M18）
| 模块 | 目录 | 核心组件 |
|------|------|---------|
| M11 | `m11_auth_pages/` | LoginPage, RegisterPage, ProtectedRoute, AuthContext |
| M12 | `m12_dashboard/` | WelcomeBanner, PendingTasks, AutoCompletedTasks, ProjectList |
| M13 | `m13_project_creation/` | QuickStartForm, IndustrySelector, ComplexityPreview, ComplianceHints |
| M14a | `m14a_project_skeleton/` | ProjectHeader, StageTimeline, ActivityList, AgentChat, SidebarPanel |
| M15 | `m15_review_dashboard/` | ReviewList, ReviewDetail, VotePanel, BatchReview, AutoApprovedBadge |
| M16 | `m16_artifact_editor/` | ArtifactViewer, ArtifactEditor, VersionHistory, AIBadge |
| M17 | `m17_agent_config/` | ModelSelector, OllamaConfig, ApiKeyConfig, AgentRoleEditor |
| M18 | `m18_usage_settings/` | UsageOverview, ProjectUsage, DailyTrendChart, GeneralSettings |

## 代码规范
1. **TypeScript**: strict 模式，禁止 any（用 unknown 替代）
2. **组件风格**: 函数式组件 + TypeScript
3. **组件命名**: PascalCase
4. **API 请求**: 统一封装在 api 目录
5. **目录划分**: components / pages / hooks / utils / api / styles

## 模块规则
1. 公开函数必须有 JSDoc
2. 每个模块独立目录
3. 模块间通过 API 接口调用

## Electron（electron/ 目录下的 .ts 文件也适用）
- `main.ts` — 窗口创建 + 安全配置 + 生命周期
- `preload.ts` — contextBridge 最小暴露
- `python-bridge.ts` — Python 后端子进程管理
- `ipc-handlers.ts` — IPC 白名单处理器

# Business Logic Agent — 项目开发指南

> **项目**：Business Logic Agent (BLA) — 基于 AI Agent 的商业逻辑工作流引擎
> **版本**：MVP v2
> **技术栈**：Electron + React + FastAPI + SQLite + Ollama
> **内置模板**：IPD（集成产品开发）— 6 阶段/8 门禁/6 Agent 角色

---

## 一、项目概述

Business Logic Agent (BLA) 是一个基于 AI Agent 的商业逻辑工作流引擎。用户可自定义阶段、门禁、角色和活动来构建业务流程，Agent 自动推进各环节。

**内置 IPD 模板**提供了一组开箱即用的默认配置：
- 6 个 AI Agent（产品经理、研发、测试、市场、制造、财务）
- 6 个阶段（概念→计划→开发→验证→发布→生命周期）
- 8 个门禁节点（CDCP → PDCP → TR3 → TR4 → TR5 → TR6 → ADCP → LDCP）
- 用户只需填写 5 个必填项即可启动项目

## 二、技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 桌面壳 | Electron | 28+ |
| 前端 | React + TypeScript | 18 + strict |
| UI 库 | Ant Design | 5.x |
| 状态管理 | Zustand | - |
| 后端 | FastAPI (Python) | 3.11+ |
| 数据库 | SQLite + aiosqlite | WAL 模式 |
| 本地 LLM | Ollama | 默认后端 |
| 云端 LLM | Anthropic / OpenAI | 高级选项 |

## 三、目录结构

```
IPDagents/
├── CLAUDE.md                          # 本文件 — 项目开发指南
├── docx/                              # 项目设计与需求文档
│   ├── architecture-v5.md             # 系统架构设计
│   ├── mvp-guide-v2.md                # MVP 完整指导
│   ├── api-design.md                  # API 端点设计
│   ├── database-schema-v3.md          # 数据库 Schema（17 表）
│   ├── security-architecture-v2.md    # 安全架构设计
│   ├── agent-system-prompts.md        # Agent 系统提示词
│   ├── ipd-workflow-template.md       # IPD 工作流模板
│   └── plugin-manifest-schema.md      # 插件清单 Schema
├── backend/                           # Python FastAPI 后端
│   ├── m0_infrastructure/             # 基础设施（配置/数据库/日志/主入口）
│   ├── m1_auth_security/              # 认证与安全（JWT/加密/中间件）
│   ├── m2_workflow_engine/            # 工作流引擎（模板/实例/阶段推进）
│   ├── m3_prompt_system/              # 提示词系统（模板渲染/上下文构建/输入过滤）
│   ├── m4_agent_orchestration/        # Agent 编排（并行/串行/辩论/LLM路由）
│   ├── m5_artifact_management/        # 产出物管理（文档/版本/附件）
│   ├── m6_review_system/              # 审核系统（门禁投票/单人模式/升级链）
│   ├── m7_plugin_system/              # 插件系统（管理器/内置插件）
│   ├── m8_realtime_communication/     # 实时通信（WebSocket 5 通道）
│   ├── m9_usage_tracking/             # 用量追踪（Token/成本统计）
│   ├── m10_recovery/                  # 异常恢复（死循环检测/熔断/降级）
│   └── conftest.py                    # 全局 pytest 配置
├── frontend/                          # React + TypeScript 前端
│   ├── src/
│   │   ├── shared/                    # 共享类型/API客户端/常量
│   │   ├── m11_auth_pages/            # 认证页面（登录/注册/受保护路由）
│   │   ├── m12_dashboard/             # 首页 Dashboard
│   │   ├── m13_project_creation/      # 项目创建向导
│   │   ├── m14a_project_skeleton/     # 项目详情骨架
│   │   ├── m15_review_dashboard/      # 审核仪表盘
│   │   ├── m16_artifact_editor/       # 产出物编辑器
│   │   ├── m17_agent_config/          # Agent 配置页
│   │   ├── m18_usage_settings/        # 用量与设置
│   │   └── App.tsx                    # 路由配置
│   ├── electron/                      # Electron 壳（见下方）
│   └── package.json
├── electron/                          # Electron 主进程
│   ├── main.ts                        # 窗口创建 + 安全配置 + 生命周期
│   ├── preload.ts                     # contextBridge 最小暴露
│   ├── python-bridge.ts              # Python 后端子进程管理
│   ├── ipc-handlers.ts               # IPC 白名单处理器
│   ├── store.ts                       # 持久化存储
│   └── updater.ts                     # 自动更新
├── shared/                            # 前后端共享代码
│   ├── types.py / types.ts            # 共享类型定义
│   ├── constants.py / constants.ts    # 共享常量
│   ├── errors.py                      # 错误码定义
│   ├── validators.py                  # 数据校验
│   ├── data_filter.py                 # 敏感数据过滤
│   └── config.py                      # 共享配置
├── MVPtext/                           # 子 Agent 任务分工
│   ├── CLAUDE.md                      # 模块索引 + 全局规则
│   ├── backend/                       # 后端各模块任务说明
│   ├── frontend/                      # 前端各模块任务说明
│   ├── electron/                      # Electron 任务说明
│   └── shared/                        # 共享模块任务说明
├── basic_code_information_archive/    # 代码中文说明档案
├── modification_log/                  # 修改日志
└── demo/                              # 测试用快捷启动程序
```

## 四、后端模块详解

| 模块 | 目录 | 核心文件 | 职责 |
|------|------|---------|------|
| M0 | `m0_infrastructure/` | `main.py`, `database.py`, `config.py`, `middleware.py` | FastAPI 应用入口、SQLite WAL 初始化、日志配置 |
| M1 | `m1_auth_security/` | `router.py`, `auth_service.py`, `security.py`, `models.py` | 注册/登录/JWT/API Key 管理 |
| M2 | `m2_workflow_engine/` | `engine.py`, `router.py`, `models.py` | IPD 6 阶段推进、门禁投票、活动触发 |
| M3 | `m3_prompt_system/` | `renderer.py`, `context_builder.py`, `input_guard.py`, `router.py` | Jinja2 模板渲染、上下文构建、注入防护 |
| M4 | `m4_agent_orchestration/` | `orchestrator.py`, `llm_router.py`, `circuit_breaker.py`, `deadlock_detector.py` | 3 种编排模式、LLM 降级链、死循环检测 |
| M5 | `m5_artifact_management/` | `artifact_service.py`, `router.py`, `models.py` | 18 种产出物 CRUD、版本管理 |
| M6 | `m6_review_system/` | `review_service.py`, `router.py`, `models.py` | 门禁审核、单人模式自动通过 |
| M7 | `m7_plugin_system/` | `plugin_service.py`, `router.py`, `models.py` | 3 个内置插件管理 |
| M8 | `m8_realtime_communication/` | `connection_manager.py`, `router.py`, `models.py` | WebSocket 5 通道管理 |
| M9 | `m9_usage_tracking/` | `usage_service.py`, `router.py`, `models.py` | Token 消耗 + 成本统计 |
| M10 | `m10_recovery/` | `recovery_manager.py`, `router.py`, `models.py` | 4 种异常恢复路径 |

## 五、前端模块详解

| 模块 | 目录 | 核心组件 | 职责 |
|------|------|---------|------|
| M11 | `m11_auth_pages/` | LoginPage, RegisterPage, ProtectedRoute, AuthContext | 认证页面 + 全局认证状态 |
| M12 | `m12_dashboard/` | WelcomeBanner, PendingTasks, AutoCompletedTasks, ProjectList | 首页 Dashboard |
| M13 | `m13_project_creation/` | QuickStartForm, IndustrySelector, ComplexityPreview, ComplianceHints | 5 必填项快速启动 |
| M14a | `m14a_project_skeleton/` | ProjectHeader, StageTimeline, ActivityList, AgentChat, SidebarPanel | 项目详情骨架 |
| M15 | `m15_review_dashboard/` | ReviewList, ReviewDetail, VotePanel, BatchReview, AutoApprovedBadge | 审核仪表盘 |
| M16 | `m16_artifact_editor/` | ArtifactViewer, ArtifactEditor, VersionHistory, AIBadge | 产出物编辑 |
| M17 | `m17_agent_config/` | ModelSelector, OllamaConfig, ApiKeyConfig, AgentRoleEditor | Agent 配置 |
| M18 | `m18_usage_settings/` | UsageOverview, ProjectUsage, DailyTrendChart, GeneralSettings | 用量与设置 |

## 六、6 个 IPD Agent 角色

| ID | 角色 | 中文名 | 核心职责 |
|----|------|--------|---------|
| `product_manager` | 产品经理 | 小王 | 需求分析、MRD/PRD、门禁决策 |
| `rd` | 研发架构师 | 老张 | 技术评估、系统设计、TR 评审 |
| `qa` | 测试专家 | - | 测试策略、用例编写、质量评估 |
| `marketing` | 市场专家 | - | 竞品分析、GTM 计划、定价 |
| `manufacturing` | 制造工程师 | - | BOM 估算、DFM 审查、供应链 |
| `finance` | 财务分析师 | - | 商业论证、成本核算、ROI 预测 |

## 七、开发规则

### 代码规范
1. **Python**：类型注解完整（mypy strict），Pydantic v2 做数据校验
2. **TypeScript**：strict 模式，禁止 any（用 unknown 替代）
3. **数据库**：所有 SQL 参数化查询，禁止字符串拼接
4. **API**：遵循统一响应格式 `{data, error, meta}`
5. **安全**：LLM 数据发送前通过 `data_filter.py` 过滤

### 模块规则
1. 模块间通过 API 接口或 service 层调用，禁止跨模块直接导入
2. 所有配置通过 config.py 或环境变量，禁止硬编码
3. 每个模块独立目录，文件不超过 15 个
4. 公开函数必须有 docstring/JSDoc

### 数据安全
1. API Key 等敏感信息 Fernet 加密存储
2. 发送 LLM 的数据仅包含必要上下文
3. Ollama 默认模式数据不出境
4. 日志禁止输出密钥、密码、身份证号、手机号、邮箱

## 八、命令速查

```bash
# 后端
cd backend && python -m pytest -q                    # 运行所有测试（99 个）
cd backend && python -m pytest m4_agent_orchestration/ # 运行单个模块测试
cd backend && python -m m0_infrastructure.main        # 启动 FastAPI 服务

# 前端
cd frontend && npx tsc --noEmit                     # TypeScript 类型检查
cd frontend && npx vite build                        # 生产构建
cd frontend && npx vite                              # 开发服务器

# 数据库
# 迁移文件位于 backend/m0_infrastructure/migrations/
# 启动时自动按序执行未执行的迁移
```

## 九、当前状态

- **后端**：M0-M10 全部完成，**170 测试通过**（99 单元 + 61 集成 + 10 冒烟）
- **前端**：M11-M18 全部完成，**224 测试通过**（29 文件，8 模块全覆盖，含组件测试）
- **总计**：**394 测试通过**
- **合规交付物**：隐私政策弹窗 + 用户协议弹窗 + AI 内容标识 + 数据出境告知 + 免责声明横幅全部就绪
- **Electron**：主进程/桥接/安全配置就绪，安全审查通过，TypeScript 编译零错误
- **数据库**：**6 个迁移**（v001-v006），覆盖全部 22 张表（含 pending_items + notifications）
- **集成**：前后端 API 契约已对齐，核心 API 端到端验证通过（注册/登录/Dashboard/创建项目/审核/产出物/设置/用量）
- **构建**：TypeScript 零错误，Vite 构建零警告（189 模块，431KB）
- **Demo**：前后端一键启动就绪，浏览器可访问 http://localhost:5173
- **最新修复**（2026-07-09）：Dashboard 500 错误、前后端字段名 camelCase 统一、缺失表迁移

## 十、项目 Skills（可插拔能力包）

项目内置 3 个 Claude Agent Skills，位于 `.claude/skills/`，按需自动加载：

| Skill | 文件 | 用途 |
|-------|------|------|
| `ipd-data-analysis` | `.claude/skills/ipd-data-analysis/SKILL.md` | IPD 数据分析（市场/财务/质量） |
| `ipd-xlsx` | `.claude/skills/ipd-xlsx/SKILL.md` | Excel 交付物（BOM/预算/进度） |
| `ipd-docx` | `.claude/skills/ipd-docx/SKILL.md` | Word 文档（MRD/PRD/技术方案） |

这些 Skill 会在处理相关任务时自动激活，无需手动调用。

## 十一、参考文档

- `docx/mvp-guide-v2.md` — MVP 完整指导（8 周计划、里程碑、风险）
- `docx/architecture-v5.md` — 系统架构设计（用户旅程、信任闭环）
- `docx/api-design.md` — 124 REST + 5 WS + 1 SSE 端点
- `docx/database-schema-v3.md` — 17 张表完整 Schema
- `docx/security-architecture-v2.md` — 安全架构设计
- `MVPtext/CLAUDE.md` — 子 Agent 任务分工规则
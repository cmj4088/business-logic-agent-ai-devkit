# Business Logic Agent — 项目设计文档

> 本文档为项目顶层设计概览，整合自 CLAUDE.md、mvp-guide-v2.md、architecture-v5.md、api-design.md、database-schema-v3.md。各领域详细设计见对应专题文档。

---

## 一、项目概述

### 1.1 项目定位
Business Logic Agent (BLA) 是一款基于 **AI Agent 的商业逻辑工作流引擎**，以 IPD（集成产品开发）为内置模板，支持用户自定义阶段、门禁、角色和活动来构建业务流程。

### 1.2 核心价值
- 用户只需填写 **5 个必填项**即可启动项目
- Agent 自动推进 **6 个阶段**：概念 → 计划 → 开发 → 验证 → 发布 → 生命周期
- 桌面应用优先，本地 LLM（Ollama）默认数据不出境

### 1.3 目标用户画像（来自 architecture-v5.md §一）
| 画像 | 角色 | 核心诉求 |
|------|------|---------|
| 小王 | 产品经理 | Agent 写的 MRD 能直接用吗 |
| 老张 | 研发总监 | TR 评审别卡在我这 |
| 李总 | 老板 | 花了多少钱，超期了吗 |

### 1.4 MVP 范围（来自 mvp-guide-v2.md §一）
- **P0 包含**：项目创建、工作流引擎、6 Agent 协作、3 种编排模式、门禁评审、产出物管理、审核仪表盘、单人模式、本地存储、安全基础、用量追踪、WebSocket、合规交付物、本地 LLM、数据过滤、异常恢复
- **P1-P3 推迟**：多用户/团队、插件市场、SSO/OAuth、多租户、Webhook、群聊模式等

---

## 二、技术选型

| 层级 | 技术 | 版本 | 选型理由 |
|------|------|------|---------|
| 桌面壳 | Electron | 28+ | 跨平台桌面应用，复用 Web 前端 |
| 前端 | React + TypeScript | 18 + strict | 生态成熟，类型安全 |
| UI 库 | Ant Design | 5.x | 企业级组件库，开箱即用 |
| 状态管理 | Zustand | - | 轻量，无 boilerplate |
| 后端 | FastAPI (Python) | 3.11+ | 异步高性能，自动 OpenAPI 文档 |
| 数据库 | SQLite + aiosqlite | WAL 模式 | 单文件部署，WAL 支持并发读 |
| 本地 LLM | Ollama | 默认后端 | 数据不出境，合规优先 |
| 云端 LLM | Anthropic / OpenAI | 高级选项 | 按需启用 |

---

## 三、需求分析

### 3.1 功能性需求摘要
1. **项目创建**：5 必填项 + 行业选择 + 智能默认值
2. **IPD 工作流**：6 阶段 24 活动（lite 模式），18 个产出物
3. **6 Agent 协作**：产品经理、研发架构师、测试、市场、制造、财务
4. **3 种编排模式**：parallel / sequential / debate + 死循环检测
5. **门禁评审**：DCP/TR 系列门禁 + 投票机制（单人模式自动通过但标注"未经人工审查"）
6. **审核仪表盘**：跨项目聚合待处理事项
7. **用量追踪**：LLM Token 消耗 + 成本统计
8. **实时通信**：WebSocket 5 通道，Agent 流式输出

### 3.2 合规需求（律师审查阻塞项）
- 隐私政策弹窗 + 用户协议弹窗
- AI 内容标识
- 数据出境告知
- 免责声明横幅

详见 `docx/security-architecture-v2.md`。

---

## 四、系统设计

### 4.1 架构分层
```
┌─────────────────────────────────────┐
│  Electron 桌面壳（main/preload/IPC）  │
├─────────────────────────────────────┤
│  React 前端（M11-M18 模块）           │
├─────────────────────────────────────┤
│  FastAPI 后端（M0-M10 模块）          │
├─────────────────────────────────────┤
│  SQLite（WAL）+ 文件系统              │
└─────────────────────────────────────┘
```

### 4.2 后端模块设计（M0-M10）
| 模块 | 职责 |
|------|------|
| M0 基础设施 | FastAPI 入口、SQLite WAL 初始化、日志 |
| M1 认证安全 | 注册/登录/JWT/API Key 管理 |
| M2 工作流引擎 | IPD 6 阶段推进、门禁投票 |
| M3 提示词系统 | Jinja2 模板渲染、上下文构建、注入防护 |
| M4 Agent 编排 | 3 种编排模式、LLM 降级链、死循环检测 |
| M5 产出物管理 | 18 种产出物 CRUD、版本管理 |
| M6 审核系统 | 门禁审核、单人模式自动通过 |
| M7 插件系统 | 3 个内置插件管理 |
| M8 实时通信 | WebSocket 5 通道管理 |
| M9 用量追踪 | Token 消耗 + 成本统计 |
| M10 异常恢复 | 4 种异常恢复路径 |
| SA 独立智能体 | Agent 独立部署、URL 注册发现、远程推理调用 |

详见 `CLAUDE.md` §四。

### 4.3 前端模块设计（M11-M18）
| 模块 | 职责 |
|------|------|
| M11 认证页面 | 登录/注册/受保护路由 |
| M12 Dashboard | 首页待办/自动完成/项目列表 |
| M13 项目创建 | 5 必填项快速启动向导 |
| M14a 项目骨架 | 项目详情（时间线/活动/Agent 聊天） |
| M15 审核仪表盘 | 门禁投票/批量审核 |
| M16 产出物编辑器 | 文档查看/编辑/版本历史 |
| M17 Agent 配置 | 模型选择/Ollama/ApiKey 配置 |
| M18 用量设置 | Token 统计/趋势图/通用设置 |

详见 `CLAUDE.md` §五。

### 4.4 数据库设计
- **22 张表**（含 pending_items + notifications），6 个迁移文件（v001-v006）
- 核心表：roles、projects、users、stages、artifacts、gate_results、agent_configs、messages、usage_logs、secrets 等
- 所有敏感字段 Fernet 加密存储

详见 `docx/database-schema-v3.md`。

### 4.5 安全设计
- LLM 数据发送前通过 `data_filter.py` 过滤敏感字段
- Prompt Injection 防护：结构隔离 + XML 标签包裹
- 文件上传校验：magic bytes
- Electron 安全配置：contextBridge 最小暴露

详见 `docx/security-architecture-v2.md`。

---

## 五、接口设计

### 5.1 统一响应格式
```json
{
  "data": { ... },
  "error": null,
  "meta": { "page": 1, "page_size": 20, "total": 150, "request_id": "uuid" }
}
```

### 5.2 端点概览
- **REST**：124 个端点（认证/项目/工作流/产出物/审核/插件/用量等）
- **WebSocket**：5 通道（Agent 流式输出/阶段状态/通知等）
- **SSE**：1 个（服务端推送事件）

### 5.3 认证
```
Authorization: Bearer <session_token>
```
- Session token：15 分钟有效
- Refresh token：30 天有效

详见 `docx/api-design.md`。

---

## 六、开发计划

### 6.1 MVP 里程碑（8 周计划）
详见 `docx/mvp-guide-v2.md` §十一。

### 6.2 当前状态（2026-07-09）
- **后端**：M0-M10 全部完成，170 测试通过
- **前端**：M11-M18 全部完成，224 测试通过
- **总计**：394 测试通过
- **合规交付物**：全部就绪
- **Electron**：主进程/桥接/安全配置就绪
- **集成**：前后端 API 契约已对齐，核心 API 端到端验证通过

### 6.3 模块化分工
子 Agent 任务分工详见 `MVPtext/CLAUDE.md` 及各模块 CLAUDE.md。

---

## 七、参考文档索引

| 文档 | 内容 |
|------|------|
| `CLAUDE.md` | 项目开发指南（技术栈/模块/Agent/命令速查） |
| `docx/mvp-guide-v2.md` | MVP 完整指导（8 周计划/里程碑/风险） |
| `docx/architecture-v5.md` | 系统架构设计（用户旅程/信任闭环） |
| `docx/api-design.md` | API 端点设计（124 REST + 5 WS + 1 SSE） |
| `docx/database-schema-v3.md` | 数据库 Schema（22 张表） |
| `docx/security-architecture-v2.md` | 安全架构设计 |
| `docx/agent-system-prompts.md` | Agent 系统提示词 |
| `docx/ipd-workflow-template.md` | IPD 工作流模板 |
| `docx/plugin-manifest-schema.md` | 插件清单 Schema |
| `docx/requirements_spec.md` | 需求规格说明书 |
| `docx/standalone-agent-design.md` | 独立智能体系统设计 |

### 7.1 新增：独立智能体系统（Standalone Agent）

详见 `docx/standalone-agent-design.md`。

**核心能力**：
- 6 个 IPD Agent 角色可作为独立的 FastAPI 微服务运行
- 每个 Agent 通过 HTTP URL 注册到主引擎
- 支持运行时注册/注销，热插拔
- 编排器优先调用远程 Agent，失败后自动降级到本地 LLM

**启动方式**：
```bash
# 启动单个 Agent
python -m standalone_agent.runner --role product_manager --port 8001

# 注册到主引擎
curl -X POST http://localhost:8000/api/agents/registry \\
  -H "Authorization: Bearer <token>" \\
  -d '{"role": "product_manager", "url": "http://localhost:8001"}'
```

**新增 API 端点**：
- `POST /api/agents/registry` — 注册远程 Agent
- `GET /api/agents/registry` — 列出所有 Agent
- `DELETE /api/agents/registry/{role}` — 取消注册
- `POST /api/agents/registry/health` — 批量健康检查

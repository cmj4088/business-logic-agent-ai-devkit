# Business Logic Agent (BLA)

> **AI 驱动的商业逻辑工作流引擎**
> 基于 Electron + React + FastAPI + SQLite 构建，内置 IPD（集成产品开发）模板

---

## 概述

Business Logic Agent (BLA) 是一个基于 AI Agent 的商业逻辑工作流引擎。用户可自定义阶段、门禁、角色和活动来构建业务流程，AI Agent 自动推进各环节。

### 内置 IPD 模板

开箱即用的 IPD（集成产品开发）模板，包含：
- **6 个 AI Agent**：产品经理（小王）、研发架构师（老张）、测试专家、市场专家、制造工程师、财务分析师
- **6 个阶段**：概念 → 计划 → 开发 → 验证 → 发布 → 生命周期
- **8 个门禁节点**：CDCP → PDCP → TR3 → TR4 → TR5 → TR6 → ADCP → LDCP
- **快速启动**：仅需填写 5 个必填项即可创建项目

---

## 技术栈

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

---

## 项目结构

```
├── backend/        # Python FastAPI 后端（10 个模块）
│   ├── m0_infrastructure/    # 基础设施（配置/数据库/日志/主入口）
│   ├── m1_auth_security/     # 认证与安全（JWT/加密/中间件）
│   ├── m2_workflow_engine/   # 工作流引擎（模板/实例/阶段推进）
│   ├── m3_prompt_system/     # 提示词系统（模板渲染/上下文构建）
│   ├── m4_agent_orchestration/ # Agent 编排（并行/串行/辩论）
│   ├── m5_artifact_management/ # 产出物管理（文档/版本/附件）
│   ├── m6_review_system/     # 审核系统（门禁投票/单人模式）
│   ├── m7_plugin_system/     # 插件系统（管理器/内置插件）
│   ├── m8_realtime_communication/ # WebSocket 实时通信
│   ├── m9_usage_tracking/    # 用量追踪（Token/成本统计）
│   └── m10_recovery/         # 异常恢复（死循环检测/熔断）
├── frontend/       # React + TypeScript 前端（8 个模块）
│   └── src/
│       ├── m11_auth_pages/           # 认证页面
│       ├── m12_dashboard/            # 首页 Dashboard
│       ├── m13_project_creation/     # 项目创建向导
│       ├── m14a_project_skeleton/    # 项目详情骨架
│       ├── m15_review_dashboard/     # 审核仪表盘
│       ├── m16_artifact_editor/      # 产出物编辑器
│       ├── m17_agent_config/         # Agent 配置页
│       └── m18_usage_settings/       # 用量与设置
├── electron/       # Electron 主进程
├── shared/         # 前后端共享类型与常量
└── docx/           # 项目设计文档
```

### 后端模块（M0-M10）

| 模块 | 目录 | 职责 |
|------|------|------|
| M0 | m0_infrastructure | FastAPI 应用入口、SQLite WAL 初始化、日志配置 |
| M1 | m1_auth_security | 注册/登录/JWT/API Key 管理 |
| M2 | m2_workflow_engine | IPD 6 阶段推进、门禁投票、活动触发 |
| M3 | m3_prompt_system | Jinja2 模板渲染、上下文构建、注入防护 |
| M4 | m4_agent_orchestration | 3 种编排模式、LLM 降级链、死循环检测 |
| M5 | m5_artifact_management | 18 种产出物 CRUD、版本管理 |
| M6 | m6_review_system | 门禁审核、单人模式自动通过 |
| M7 | m7_plugin_system | 3 个内置插件管理 |
| M8 | m8_realtime_communication | WebSocket 5 通道管理 |
| M9 | m9_usage_tracking | Token 消耗 + 成本统计 |
| M10 | m10_recovery | 4 种异常恢复路径 |

### 前端模块（M11-M18）

| 模块 | 目录 | 职责 |
|------|------|------|
| M11 | m11_auth_pages | 登录/注册/受保护路由 |
| M12 | m12_dashboard | 首页 Dashboard（欢迎横幅/待办/项目列表） |
| M13 | m13_project_creation | 5 项必填快速启动向导 |
| M14a | m14a_project_skeleton | 项目详情（阶段时间线/活动列表/Agent 聊天） |
| M15 | m15_review_dashboard | 审核列表/详情/投票/批量审核 |
| M16 | m16_artifact_editor | 产出物查看/编辑/版本历史 |
| M17 | m17_agent_config | 模型选择/Ollama 配置/API Key 管理 |
| M18 | m18_usage_settings | 用量概览/项目用量/每日趋势/通用设置 |

---

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 18+
- (可选) Ollama 用于本地 LLM

### 安装

```bash
# 后端
cd backend
pip install -r requirements.txt

# 前端
cd frontend
npm install
```

### 运行

```bash
# 启动后端（终端 1）
cd backend
python -m m0_infrastructure.main

# 启动前端（终端 2）
cd frontend
npx vite
```

### 运行测试

```bash
# 后端测试（170 个）
cd backend
python -m pytest -q

# 前端类型检查
cd frontend
npx tsc --noEmit
```

---

## 测试状态

- **后端**：170 测试通过（99 单元测试 + 61 集成测试 + 10 冒烟测试）
- **前端**：224 测试通过（29 文件，8 模块全覆盖）
- **总计**：**394 测试通过**

---

## 6 个 IPD Agent 角色

| ID | 角色 | 核心职责 |
|----|------|---------|
| product_manager | 产品经理（小王） | 需求分析、MRD/PRD、门禁决策 |
| rd | 研发架构师（老张） | 技术评估、系统设计、TR 评审 |
| qa | 测试专家 | 测试策略、用例编写、质量评估 |
| marketing | 市场专家 | 竞品分析、GTM 计划、定价 |
| manufacturing | 制造工程师 | BOM 估算、DFM 审查、供应链 |
| finance | 财务分析师 | 商业论证、成本核算、ROI 预测 |

---

## 开源许可

[MIT](LICENSE)

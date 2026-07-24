# Business Logic Agent — MVP 开发规则

> **项目**：Business Logic Agent (BLA) — 基于 AI Agent 的商业逻辑工作流引擎（内置 IPD 模板）
> **版本**：MVP v2
> **目标**：8 周内交付可用的单用户桌面应用，支持 6 Agent 协作完成 lite 模式完整 IPD 项目生命周期

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 桌面壳 | Electron 28+ | 主进程 + preload + 渲染进程 |
| 前端 | React 18 + TypeScript | React Router v6, 无状态管理库（Context 即可） |
| 后端 | FastAPI (Python 3.11+) | 子进程启动，通过 localhost 端口通信 |
| 数据库 | SQLite 3 | WAL 模式，应用层 Fernet 加密敏感字段 |
| 本地 LLM | Ollama | 默认后端，数据不出境 |
| 云端 LLM | Anthropic / OpenAI | 作为"高级选项"，需用户主动配置并同意数据出境 |
| 打包 | PyInstaller + electron-builder | 单文件桌面应用 |

---

## 模块索引

### 后端模块（`backend/`）

| 编号 | 目录 | 名称 | 依赖 | 负责 Agent |
|------|------|------|------|-----------|
| M0 | `m0-infrastructure` | 基础设施 | 无 | 后端开发 A |
| M1 | `m1-auth-security` | 认证与安全 | M0 | 后端开发 A |
| M2 | `m2-workflow-engine` | 工作流引擎 | M0, M1 | 后端开发 B |
| M3 | `m3-prompt-system` | 提示词系统 | M0, M1 | 后端开发 B |
| M4 | `m4-agent-orchestration` | Agent 编排 | M0, M1, M2, M3 | 后端开发 B |
| M5 | `m5-artifact-management` | 产出物管理 | M0, M1, M4 | 全栈开发 C |
| M6 | `m6-review-system` | 审核系统 | M0, M1, M2, M5 | 全栈开发 C |
| M7 | `m7-plugin-system` | 插件系统 | M0, M1, M4 | 全栈开发 F |
| M8 | `m8-realtime-communication` | 实时通信 | M0, M1, M4 | 全栈开发 C |
| M9 | `m9-usage-tracking` | 用量追踪 | M0, M1, M4 | 全栈开发 C |
| M10 | `m10-recovery` | 异常恢复 | M0, M1, M4 | 后端开发 A |

### 前端模块（`frontend/`）

| 编号 | 目录 | 名称 | 依赖 | 负责 Agent |
|------|------|------|------|-----------|
| M11 | `m11-auth-pages` | 认证页面 | M1 | 前端开发 D |
| M12 | `m12-dashboard` | 首页 Dashboard | M8, M9 | 前端开发 D |
| M13 | `m13-project-creation` | 项目创建向导 | M2 | 前端开发 D |
| M14a | `m14a-project-skeleton` | 项目详情骨架 | M2, M8 | 前端开发 D |
| M14b | `m14b-project-integration` | 项目详情联调 | M14a, M8, M10 | 前端开发 E |
| M15 | `m15-review-dashboard` | 审核仪表盘 | M6 | 前端开发 E |
| M16 | `m16-artifact-editor` | 产出物编辑 | M5, M10 | 前端开发 E |
| M17 | `m17-agent-config` | Agent 配置页 | M3, M4 | 全栈开发 F |
| M18 | `m18-usage-settings` | 用量与设置 | M9, M1 | 全栈开发 F |

### 其他

| 目录 | 说明 |
|------|------|
| `electron/` | Electron 主进程、preload 脚本、窗口管理 |
| `shared/` | 前后端共享类型定义、常量、校验规则 |

---

## 全局规则（所有 Agent 必须遵守）

### 技术规则
1. **Python 代码**：类型注解必须完整（mypy strict 模式），使用 Pydantic v2 做数据校验
2. **TypeScript 代码**：严格模式（strict: true），禁止 any（用 unknown 替代）
3. **数据库**：所有 SQL 操作必须用参数化查询，禁止字符串拼接
4. **API**：遵循 `docs/api-design.md` 的命名规范和响应格式
5. **安全**：所有发送到 LLM 的文本必须先经过 `data_filter.py` 过滤敏感信息

### 数据安全规则
1. **禁止明文存储密钥**：API Key 等敏感信息必须 Fernet 加密后存储
2. **数据最小化**：发送给 LLM 的数据仅包含必要上下文，禁止附带完整数据库记录
3. **数据出境控制**：Ollama 模式下数据不出境；云端 API 模式必须用户主动勾选同意
4. **日志脱敏**：日志中禁止输出密钥、密码、身份证号、手机号、邮箱

### 代码提交规则
1. 每个模块独立目录，模块内文件不超过 15 个（超出则拆分子模块）
2. 所有公开函数必须有 docstring（Python）或 JSDoc（TypeScript）
3. 数据库迁移用版本号命名：`migrations/v001_xxx.sql`
4. 单元测试覆盖率 ≥ 70%（核心路径 100%）

### 禁止事项
1. **禁止跨模块直接导入**：模块间通过 API 接口或明确的 service 层调用
2. **禁止硬编码配置**：所有配置通过环境变量或 `config.yaml` 读取
3. **禁止在前端直接操作数据库**：所有数据操作通过 FastAPI 接口
4. **禁止绕过安全中间件**：所有 API 端点必须经过认证和输入校验
5. **禁止引入新的编程语言或框架**：严格使用上述技术栈

---

## 6 个 IPD Agent 角色

| ID | 角色 | 系统提示词文件 | 核心职责 |
|----|------|--------------|---------|
| `product_manager` | 产品经理 | `templates/product_manager.j2` | 需求分析、MRD/PRD、门禁决策 |
| `rd` | 研发架构师 | `templates/rd.j2` | 技术评估、系统设计、TR 评审 |
| `qa` | 测试专家 | `templates/qa.j2` | 测试策略、用例编写、质量评估 |
| `marketing` | 市场专家 | `templates/marketing.j2` | 竞品分析、GTM 计划、定价 |
| `manufacturing` | 制造工程师 | `templates/manufacturing.j2` | BOM 估算、DFM 审查、供应链 |
| `finance` | 财务分析师 | `templates/finance.j2` | 商业论证、成本核算、ROI 预测 |

---

## IPD 6 阶段（lite 模式）

```
概念 → 计划 → 开发 → 验证 → 发布 → 生命周期
CDCP    PDCP   TR3/4  TR5/6  ADCP   LDCP
```

---

## 项目 Skills

项目内置 3 个 Claude Agent Skills（`.claude/skills/`），按需自动加载：

| Skill | 用途 | 适用 Agent |
|-------|------|-----------|
| `ipd-data-analysis` | 数据分析（市场/财务/质量） | 市场、财务、QA |
| `ipd-xlsx` | Excel 交付物（BOM/预算/进度） | 制造、财务、研发 |
| `ipd-docx` | Word 文档（MRD/PRD/技术方案） | 产品经理、研发 |

---

## 子 Agent 任务分配（详细）

### 一、后端开发 A — 负责模块：M0, M1, M10

| 模块 | 模块名称 | 任务清单 | 技能使用 |
|------|---------|---------|---------|
| **M0** | 基础设施 | ① FastAPI 应用初始化、路由注册、中间件注册<br>② SQLite 连接池、WAL 模式配置、建表迁移（v001-v006）<br>③ 配置管理（config.yaml + 环境变量）<br>④ structlog 结构化日志初始化<br>⑤ `GET /api/health` 健康检查端点<br>⑥ startup/shutdown 事件处理 | 无 |
| **M1** | 认证与安全 | ① 用户注册/登录（邮箱+密码，JWT Token）<br>② Token 管理（Session 15 分钟 + Refresh 30 天）<br>③ 密码安全（bcrypt 哈希，≥8位含数字+字母）<br>④ API Key 管理（Fernet 加密存储 Anthropic/OpenAI Key）<br>⑤ 安全中间件（认证、CORS、Rate Limiting）<br>⑥ 会话管理（token 黑名单） | 无 |
| **M10** | 异常恢复 | ① 死循环检测（debate 模式语义相似度 > 0.85 终止）<br>② 熔断器（连续 5 次 LLM 失败 → 10 分钟自动重试）<br>③ 降级策略（Ollama 失败 → Anthropic → OpenAI → Ollama）<br>④ 格式降级（JSON 解析失败 2 次 → 纯文本降级）<br>⑤ 语言降级（非中文输出 → 自动重试）<br>⑥ 异常恢复面板数据接口 | 无 |

### 二、后端开发 B — 负责模块：M2, M3, M4

| 模块 | 模块名称 | 任务清单 | 技能使用 |
|------|---------|---------|---------|
| **M2** | 工作流引擎 | ① 加载 `standard_ipd_v3.json` 工作流模板 CRUD<br>② 项目创建 + 复杂度自动判定（lite/standard/full）<br>③ 6 阶段顺序推进（概念→计划→开发→验证→发布→生命周期）<br>④ 活动裁剪（lite:24 / standard:31 / full:34）<br>⑤ DCP/TR 门禁触发和通过判定<br>⑥ Exit Criteria 阻断级/关注级检查<br>⑦ 阶段完成自动触发成本核算后台任务<br>⑧ 侧边栏小组件（供应链/认证/竞品/预算）状态推送<br>⑨ 阶段回退（最多 2 次） | **ipd-xlsx**：在阶段推进时自动生成 BOM 成本表、项目进度表<br>**ipd-docx**：在阶段完成时生成阶段评审文档模板 |
| **M3** | 提示词系统 | ① 6 个 Agent 角色 Jinja2 提示词模板 CRUD + 版本管理<br>② 模板渲染（根据项目上下文渲染最终 system prompt）<br>③ 上下文构建（从项目/阶段/产出物提取上下文变量）<br>④ 渲染前调用 `data_filter.py` 过滤敏感信息<br>⑤ XML 标签包裹（`<user_input>` 防 prompt injection）<br>⑥ 系统指令和用户输入结构隔离<br>**⑦ 技能注入**：在模板中注入技能调用指令，使 Agent 能自动调用对应 Skill | 需在模板中注入技能调用入口：<br>· `product_manager` → 可调用 `ipd-docx`<br>· `rd` → 可调用 `ipd-xlsx`、`ipd-docx`<br>· `qa` → 可调用 `ipd-data-analysis`<br>· `marketing` → 可调用 `ipd-data-analysis`<br>· `manufacturing` → 可调用 `ipd-xlsx`<br>· `finance` → 可调用 `ipd-data-analysis`、`ipd-xlsx` |
| **M4** | Agent 编排 | ① 3 种编排模式：parallel/sequential/debate<br>② 统一 LLM 调用接口（Ollama/Anthropic/OpenAI）<br>③ LLM Router 自动降级切换<br>④ 死循环检测（debate 连续 3 轮无新观点终止）<br>⑤ 熔断器（连续 5 次失败 → 10 分钟后自动重试）<br>⑥ 推理摘要生成（Agent 推理过程中文摘要）<br>⑦ Token 管理（max_tokens 截断）<br>⑧ 语言检测（非中文 → 重试）<br>⑨ JSON 输出解析（失败 2 次 → 纯文本）<br>**⑩ 技能调度**：编排时根据活动类型自动触发对应 Skill | 编排过程中根据活动类型自动注入 Skill 调用：<br>· 市场分析活动 → 调用 `ipd-data-analysis`<br>· 财务计算活动 → 调用 `ipd-data-analysis`<br>· BOM 生成活动 → 调用 `ipd-xlsx`<br>· 文档生成活动 → 调用 `ipd-docx` |

### 三、全栈开发 C — 负责模块：M5, M6, M8, M9

| 模块 | 模块名称 | 任务清单 | 技能使用 |
|------|---------|---------|---------|
| **M5** | 产出物管理 | ① 18 种产出物类型 CRUD<br>② 版本管理（每次修改创建新版本，旧版本保留只读）<br>③ Markdown 渲染（存储/渲染）<br>④ 附件管理（上传/下载/删除，最大 50MB，magic bytes 校验）<br>⑤ AIBadge 数据（AI 生成标识 + 可信度）<br>⑥ Agent 编排完成后自动创建/更新对应产出物<br>**⑦ 技能集成**：产出物生成时自动调用对应 Skill 生成格式化内容 | **ipd-xlsx**：<br>· BOM 成本表（物料清单、自动汇总公式）<br>· 财务预算表（预算 vs 实际、超预算标红）<br>· 项目进度表（甘特图格式、自动计算工期）<br>· 竞品对比矩阵（雷达图、加权评分）<br>**ipd-docx**：<br>· MRD（市场需求文档）<br>· PRD（产品需求文档）<br>· 技术方案文档<br>· 测试报告<br>· 商业论证文档<br>**ipd-data-analysis**：<br>· 市场分析数据集成到 MRD<br>· 质量分析数据集成到测试报告 |
| **M6** | 审核系统 | ① DCP/TR 门禁投票机制<br>② 单人模式（自动通过 + 标注"自动通过，未经人工实质审查"）<br>③ 审核升级（门禁失败后升级路径）<br>④ 遗留问题追踪（关注级 exit criteria 未完成）<br>⑤ 审核仪表盘数据（跨项目聚合待处理审核事项）<br>⑥ 行业合规提示（根据项目行业显示合规提醒）<br>**⑦ 数据支撑**：审核统计面板集成数据分析 | **ipd-data-analysis**：<br>· 审核通过率统计<br>· 门禁趋势分析<br>· 遗留问题分布统计 |
| **M8** | 实时通信 | ① WebSocket 5 通道管理（dashboard/stage/messages/review/rounds）<br>② 连接管理（连接/断开/心跳/重连）<br>③ 消息广播和路由<br>④ 降级轮询（WebSocket 不可用时 fallback 到 HTTP 轮询）<br>⑤ 认证校验（token 验证） | 无 |
| **M9** | 用量追踪 | ① Token 消耗统计（每次 LLM 调用记录 token 用量）<br>② 成本统计（按模型单价计算成本）<br>③ 项目级/全局级用量汇总<br>④ 预算预警（超预算自动通知）<br>⑤ 每日趋势数据<br>**⑥ 分析集成**：用量数据的统计和分析 | **ipd-data-analysis**：<br>· Token 消耗趋势分析<br>· 成本分布分析<br>· 预算执行情况统计分析 |

### 四、前端开发 D — 负责模块：M11, M12, M13, M14a

| 模块 | 模块名称 | 任务清单 | 技能使用 |
|------|---------|---------|---------|
| **M11** | 认证页面 | ① LoginPage（登录表单、Token 存储、错误提示）<br>② RegisterPage（注册表单、密码强度校验、邮箱格式校验）<br>③ ProtectedRoute（路由守卫、未登录重定向）<br>④ AuthContext（全局认证状态 Provider） | 无 |
| **M12** | Dashboard | ① WelcomeBanner（欢迎语 + 快速入口）<br>② PendingTasks（待处理任务列表，来自 WebSocket 推送）<br>③ AutoCompletedTasks（自动完成任务列表）<br>④ ProjectList（项目列表，可搜索/筛选）<br>⑤ 数据可视化卡片（项目总数、进行中、已完成）<br>⑥ WebSocket 降级轮询（Dashboard 实时数据） | 无（前端仅展示数据，数据分析由后端 M9 通过 ipd-data-analysis 完成） |
| **M13** | 项目创建向导 | ① QuickStartForm（5 必填项：项目名称/行业/产品类型/团队规模/预算）<br>② IndustrySelector（行业选择器，含合规提示）<br>③ ComplexityPreview（复杂度预览：lite/standard/full）<br>④ ComplianceHints（行业合规提示）<br>⑤ 创建成功后自动跳转到项目详情页 | 无 |
| **M14a** | 项目详情骨架 | ① 项目详情页布局（左侧时间线 + 中间主内容区 + 右侧面板）<br>② StageTimeline（6 阶段时间线，当前阶段高亮）<br>③ ActivityList（当前阶段活动列表，已裁剪）<br>④ AgentChat 基础组件（Agent 对话展示区骨架）<br>⑤ 门禁状态栏（当前阶段门禁通过状态）<br>⑥ 侧边栏面板容器（预算/供应链/认证/竞品小组件）<br>⑦ ProjectHeader（项目名称、状态、进度条、操作按钮）<br>⑧ WebSocket 连接（useProjectWS） | 无（前端骨架，展示由后端 M5 通过技能生成的数据） |

### 五、前端开发 E — 负责模块：M14b, M15, M16

| 模块 | 模块名称 | 任务清单 | 技能使用 |
|------|---------|---------|---------|
| **M14b** | 项目详情联调 | ① 与 M14a 骨架组件联调，填充真实数据<br>② 与 M8 WebSocket 联调，接收实时消息和状态更新<br>③ 与 M10 异常恢复联调，展示 RecoveryPanel<br>④ 与 M2 工作流引擎联调，实现阶段推进/回退操作<br>⑤ 与 M4 Agent 编排联调，展示 Agent 对话实时流<br>⑥ 侧边栏面板数据填充（从 M2 widget 接口获取） | 无（前端联调，确保后端技能生成的数据正确展示） |
| **M15** | 审核仪表盘 | ① ReviewList（待审核列表，按项目/阶段/门禁类型分组）<br>② ReviewDetail（审核详情，产出物预览 + 门禁检查项）<br>③ VotePanel（投票面板：通过/驳回/附条件通过）<br>④ BatchReview（批量审核功能）<br>⑤ AutoApprovedBadge（自动通过标识）<br>⑥ 审核统计图表（通过率、趋势、分布） | 前端展示由 M6 后端通过 `ipd-data-analysis` 生成的审核统计数据 |
| **M16** | 产出物编辑器 | ① ArtifactViewer（产出物预览，Markdown 渲染）<br>② ArtifactEditor（Markdown 编辑器，支持实时预览）<br>③ VersionHistory（版本历史列表，版本对比）<br>④ AIBadge 展示（AI 生成标识 + 可信度）<br>⑤ 附件管理组件（上传/下载/删除）<br>**⑥ 技能产出物预览**：支持预览由 Skill 生成的 Excel/Word 文件 | 前端展示由 M5 后端通过技能生成的产出物：<br>· `ipd-xlsx` 生成的 Excel 文件 → 提供在线预览或下载<br>· `ipd-docx` 生成的 Word 文件 → 提供在线预览或下载<br>· `ipd-data-analysis` 生成的报告 → Markdown 渲染展示 |

### 六、全栈开发 F — 负责模块：M7, M17, M18

| 模块 | 模块名称 | 任务清单 | 技能使用 |
|------|---------|---------|---------|
| **M7** | 插件系统 | ① 3 个内置插件管理（CRUD + 启用/禁用）<br>② 插件清单解析（manifest.json 校验）<br>③ 插件生命周期（安装/卸载/升级）<br>④ 插件沙箱（安全隔离）<br>⑤ 插件市场接口 | 无（插件系统本身不直接使用技能，但为技能提供扩展框架） |
| **M17** | Agent 配置页 | ① ModelSelector（模型选择器：Ollama/Anthropic/OpenAI）<br>② OllamaConfig（Ollama 连接配置：base_url、model）<br>③ ApiKeyConfig（API Key 管理：加密存储/测试连接）<br>④ AgentRoleEditor（角色提示词编辑器：查看/编辑各 Agent 系统提示词）<br>**⑤ 技能开关**：在每个 Agent 配置中增加技能启用/禁用开关 | 配置页增加技能管理：<br>· 每个 Agent 角色显示可用的 Skill 列表<br>· 提供启用/禁用开关<br>· 编辑 Agent 提示词时注入 Skill 调用指令 |
| **M18** | 用量与设置 | ① UsageOverview（用量概览：总 Token、总成本、本月趋势）<br>② ProjectUsage（项目级用量明细，按项目/阶段/Agent 筛选）<br>③ DailyTrendChart（每日 Token 消耗趋势图，Chart.js）<br>④ GeneralSettings（通用设置：语言、主题、通知开关）<br>⑤ 预算预警设置（阈值配置）<br>⑥ 数据导出功能 | 用量数据的统计图表由 M9 后端通过 `ipd-data-analysis` 生成分析数据，前端负责可视化展示 |

---

## 技能与模块映射矩阵

| 技能 | 后端模块 | 前端模块 | 适用 IPD 角色 |
|------|---------|---------|-------------|
| `ipd-data-analysis` | M5（产出物数据）、M6（审核统计）、M9（用量分析） | M15（审核图表）、M16（报告展示）、M18（用量图表） | 市场、财务、QA |
| `ipd-xlsx` | M2（BOM/进度表）、M5（Excel 交付物） | M16（Excel 预览/下载） | 制造、财务、研发 |
| `ipd-docx` | M2（阶段文档模板）、M5（Word 交付物） | M16（Word 预览/下载） | 产品经理、研发 |

---

## IPD 阶段 × Agent × Skill 任务矩阵

| IPD 阶段 | 参与 Agent | 主要产出物 | 使用的 Skill |
|---------|-----------|-----------|-------------|
| **概念** | 产品经理、市场、财务 | 客户需求摘要、初步商业计划书、MRD | `ipd-docx`（MRD 文档）、`ipd-data-analysis`（市场数据） |
| **计划** | 产品经理、研发、制造、财务 | PRD、系统架构设计、BOM 估算、PDCP 材料 | `ipd-docx`（PRD/技术方案）、`ipd-xlsx`（BOM/预算表） |
| **开发** | 研发、QA | 详细设计文档、测试用例集、TR4 报告 | `ipd-docx`（设计文档）、`ipd-xlsx`（测试用例表） |
| **验证** | QA、产品经理 | 系统测试报告、TR5/TR6 报告、ADCP 材料 | `ipd-data-analysis`（质量数据）、`ipd-docx`（测试报告） |
| **发布** | 市场、制造、财务 | GTM 执行计划、首批生产报告 | `ipd-xlsx`（生产计划表）、`ipd-data-analysis`（市场分析） |
| **生命周期** | 产品经理、财务、研发 | 运营评审报告、迭代需求清单 | `ipd-data-analysis`（运营数据）、`ipd-docx`（评审报告） |

---

## 参考文档

- `docs/mvp-guide-v2.md` — MVP 完整指导文件
- `docs/architecture-v5.md` — 系统架构设计
- `docs/api-design.md` — API 端点设计（124 REST + 5 WS + 1 SSE）
- `docs/database-schema-v3.md` — 数据库 Schema（17 表）
- `docs/security-architecture-v2.md` — 安全架构设计
- `docs/agent-system-prompts.md` — Agent 系统提示词
- `docs/ipd-workflow-template.md` — IPD 工作流模板（standard_ipd_v3）
- `docs/plugin-manifest-schema.md` — 插件清单 Schema

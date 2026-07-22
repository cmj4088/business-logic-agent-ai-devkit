# Business Logic Agent — 需求规格说明书

> 本文档基于 CLAUDE.md、mvp-guide-v2.md、architecture-v5.md、api-design.md、security-architecture-v2.md 整理。各领域详细规格见对应专题文档。

---

## 一、引言

### 1.1 目的
本文档定义 Business Logic Agent (BLA) MVP v2 的完整需求规格，作为开发、测试、验收的基准。

### 1.2 范围
- **覆盖**：MVP v2 全部 P0 功能（单人模式、lite 工作流、6 Agent 协作、本地 LLM）
- **不覆盖**：P1-P3 推迟项（多用户、插件市场、SSO、多租户、Webhook、群聊模式等）

### 1.3 术语
| 术语 | 含义 |
|------|------|
| IPD | 集成产品开发（Integrated Product Development） |
| DCP | 决策检查点（Decision Check Point）门禁 |
| TR | 技术评审（Technical Review）门禁 |
| lite 模式 | 24 活动 / 18 产出物的精简 IPD 流程 |
| 单人模式 | 所有审核/投票自动通过，UI 标注"未经人工实质审查" |
| Agent | AI 角色（产品经理/研发/测试/市场/制造/财务） |

### 1.4 参考文档
- `docx/project_design.md` — 项目设计文档
- `docx/mvp-guide-v2.md` — MVP 完整指导
- `docx/architecture-v5.md` — 系统架构设计
- `docx/api-design.md` — API 端点设计
- `docx/database-schema-v3.md` — 数据库 Schema
- `docx/security-architecture-v2.md` — 安全架构设计

---

## 二、总体描述

### 2.1 产品定位
AI 驱动的 IPD 桌面应用，6 个 Agent 协作完成从概念到生命周期的全流程，用户填 5 个必填项即可启动。

### 2.2 用户画像
| 画像 | 角色 | 使用频率 | 核心诉求 |
|------|------|---------|---------|
| 小王 | 产品经理 | 每天 2 次 | Agent 写的 MRD 能直接用吗 |
| 老张 | 研发总监 | 每周被@审核 5-8 次 | TR 评审别卡在我这 |
| 李总 | 老板 | 每周一看报表 | 花了多少钱，超期了吗 |

### 2.3 运行环境
- **操作系统**：Windows 11（MVP 优先）/ macOS / Linux（后续）
- **运行时**：Python 3.11+ / Node.js 18+ / Electron 28+
- **数据库**：SQLite（WAL 模式，单文件）
- **LLM**：Ollama（默认本地）/ Anthropic / OpenAI（高级选项）

### 2.4 约束
1. 数据不出境优先（Ollama 默认模式）
2. 单用户桌面应用（MVP 不做多用户）
3. 合规前置（隐私政策/用户协议/AI 标识/数据出境告知/免责声明）
4. 模块间通过 API 或 service 层调用，禁止跨模块直接导入

---

## 三、功能需求

### 3.1 认证与用户管理（M1）
| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| AUTH-01 | 用户注册（邮箱 + 密码） | P0 |
| AUTH-02 | 用户登录，返回 JWT session + refresh token | P0 |
| AUTH-03 | API Key 管理（Fernet 加密存储） | P0 |
| AUTH-04 | 受保护路由校验 | P0 |

### 3.2 项目创建（M13）
| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| PROJ-01 | 5 必填项快速启动（项目名/行业/复杂度/目标周期/预算） | P0 |
| PROJ-02 | 行业选择器 + 智能默认值 | P0 |
| PROJ-03 | 复杂度预览（lite/standard/full） | P0 |
| PROJ-04 | 合规提示（数据出境告知） | P0 |

### 3.3 IPD 工作流引擎（M2）
| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| FLOW-01 | 6 阶段推进（概念→计划→开发→验证→发布→生命周期） | P0 |
| FLOW-02 | lite 模式 24 活动 | P0 |
| FLOW-03 | 门禁投票（DCP/TR 系列） | P0 |
| FLOW-04 | 单人模式自动通过（标注"未经人工审查"） | P0 |
| FLOW-05 | 阶段回退 | P0 |

### 3.4 Agent 编排（M4）
| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| AGENT-01 | 6 个 Agent 角色（产品经理/研发/测试/市场/制造/财务） | P0 |
| AGENT-02 | parallel 编排模式（并行执行） | P0 |
| AGENT-03 | sequential 编排模式（串行执行） | P0 |
| AGENT-04 | debate 编排模式（辩论） | P0 |
| AGENT-05 | 死循环检测 + 自动终止 | P0 |
| AGENT-06 | LLM 降级链（云端→本地 Ollama） | P0 |

### 3.5 产出物管理（M5）
| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| ART-01 | 18 种产出物 CRUD（lite 模式） | P0 |
| ART-02 | 版本管理 | P0 |
| ART-03 | AI 内容标识 | P0 |

### 3.6 审核系统（M6）
| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| REV-01 | 门禁审核列表 | P0 |
| REV-02 | 投票面板 | P0 |
| REV-03 | 批量审核 | P0 |
| REV-04 | 单人模式自动通过徽章 | P0 |

### 3.7 Dashboard（M12）
| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| DASH-01 | 待处理任务聚合 | P0 |
| DASH-02 | 自动完成任务展示 | P0 |
| DASH-03 | 项目列表 | P0 |

### 3.8 实时通信（M8）
| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| WS-01 | WebSocket 5 通道 | P0 |
| WS-02 | Agent 流式输出 | P0 |
| WS-03 | 阶段状态变更推送 | P0 |

### 3.9 用量追踪（M9）
| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| USG-01 | Token 消耗统计 | P0 |
| USG-02 | 成本统计 | P0 |
| USG-03 | 每日趋势图 | P0 |

### 3.10 异常恢复（M10）
| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| REC-01 | Agent 失败重试 | P0 |
| REC-02 | 辩论死循环终止 | P0 |
| REC-03 | LLM 降级切换 | P0 |
| REC-04 | 带着遗留问题前进 | P0 |

### 3.11 合规交付物
| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| COMP-01 | 隐私政策弹窗 | P0 |
| COMP-02 | 用户协议弹窗 | P0 |
| COMP-03 | AI 内容标识 | P0 |
| COMP-04 | 数据出境告知 | P0 |
| COMP-05 | 免责声明横幅 | P0 |

---

## 四、非功能需求

### 4.1 性能
| 需求 ID | 指标 |
|---------|------|
| PERF-01 | API 响应时间 P95 < 500ms（不含 LLM 调用） |
| PERF-02 | WebSocket 消息延迟 < 100ms |
| PERF-03 | 前端首屏加载 < 2s |
| PERF-04 | SQLite 查询 P95 < 50ms |

### 4.2 安全
| 需求 ID | 描述 |
|---------|------|
| SEC-01 | API Key Fernet 加密存储 |
| SEC-02 | LLM 数据发送前 data_filter 过滤 |
| SEC-03 | Prompt Injection 防护（结构隔离 + XML 标签） |
| SEC-04 | 文件上传 magic bytes 校验 |
| SEC-05 | Electron contextBridge 最小暴露 |
| SEC-06 | SQL 参数化查询，禁止字符串拼接 |
| SEC-07 | 日志禁止输出密钥/密码/身份证号/手机号/邮箱 |

### 4.3 可靠性
| 需求 ID | 描述 |
|---------|------|
| REL-01 | SQLite WAL 模式 + busy_timeout |
| REL-02 | LLM 降级链（云端失败→本地 Ollama） |
| REL-03 | 死循环检测 + 熔断 |
| REL-04 | 异常恢复 4 路径 |

### 4.4 可维护性
| 需求 ID | 描述 |
|---------|------|
| MAINT-01 | Python 类型注解完整（mypy strict） |
| MAINT-02 | TypeScript strict 模式，禁止 any |
| MAINT-03 | 每个模块独立目录，文件不超过 15 个 |
| MAINT-04 | 公开函数必须有 docstring/JSDoc |
| MAINT-05 | 模块间通过 API 或 service 层调用 |

### 4.5 合规
| 需求 ID | 描述 |
|---------|------|
| LEG-01 | Ollama 默认模式数据不出境 |
| LEG-02 | 隐私政策/用户协议/AI 标识/数据出境告知/免责声明就绪 |
| LEG-03 | 发送 LLM 的数据仅包含必要上下文 |

---

## 五、接口需求

### 5.1 外部接口
| 接口 | 方向 | 说明 |
|------|------|------|
| Ollama API | 出 | 本地 LLM 调用（默认后端） |
| Anthropic API | 出 | 云端 LLM（高级选项） |
| OpenAI API | 出 | 云端 LLM（高级选项） |

### 5.2 内部接口（前后端）
- **REST**：124 个端点，统一响应格式 `{data, error, meta}`
- **WebSocket**：5 通道（Agent 流式输出/阶段状态/通知等）
- **SSE**：1 个（服务端推送事件）
- **认证**：`Authorization: Bearer <session_token>`

详见 `docx/api-design.md`。

### 5.3 IPC 接口（Electron ↔ 前端）
- contextBridge 最小暴露
- IPC 白名单处理器
- Python 后端子进程管理

详见 `electron/ipc-handlers.ts`、`electron/python-bridge.ts`。

### 5.4 数据库接口
- SQLite WAL 模式，22 张表
- 所有查询参数化
- 迁移文件 v001-v006，启动时自动按序执行

详见 `docx/database-schema-v3.md`。

---

## 六、验收标准（MVP 硬指标）

来自 `docx/mvp-guide-v2.md` §1.3：

- ✅ 一个 lite 模式项目从概念到发布完整跑通
- ✅ 6 个 Agent 成功完成至少一次 debate 协作（含死循环检测验证）
- ✅ lite 模式 18 个产出物类型全部至少生成过一次
- ✅ 3 种编排模式（parallel/sequential/debate）全部验证通过
- ✅ 冒烟测试 30/30 通过
- ✅ 压力测试 11/11 通过（含 4 个 LLM 异常场景）
- ✅ Agent 产出质量评估：18 个产出物各至少 3/5 分
- ✅ 无 P0 安全漏洞 + 8 项法律阻塞项全部完成
- ✅ 合规交付物就绪

**当前状态**（2026-07-09）：394 测试通过（后端 170 + 前端 224），前后端 API 契约对齐，核心 API 端到端验证通过。

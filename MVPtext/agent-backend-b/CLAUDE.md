# Agent: 后端开发 B — 任务分配

> **角色**：后端开发 B
> **负责模块**：M2（工作流引擎）、M3（提示词系统）、M4（Agent 编排）
> **开发周期**：Week 1-6
> **技能使用**：`ipd-xlsx`、`ipd-docx`、`ipd-data-analysis`（编排调度）

---

## 一、M2 — 工作流引擎

### 任务清单
- [ ] 加载 `standard_ipd_v3.json` 工作流模板 CRUD
- [ ] 项目创建 + 复杂度自动判定（lite/standard/full）
- [ ] 6 阶段顺序推进（概念→计划→开发→验证→发布→生命周期）
- [ ] 活动裁剪（lite:24 / standard:31 / full:34）
- [ ] DCP/TR 门禁触发和通过判定
- [ ] Exit Criteria 阻断级/关注级检查
- [ ] 阶段完成自动触发成本核算后台任务
- [ ] 侧边栏小组件（供应链/认证/竞品/预算）状态推送
- [ ] 阶段回退（最多 2 次）

### 技能集成任务
- [ ] **阶段完成时自动调用 Skill**：
  | 阶段 | 调用的 Skill | 生成内容 |
  |------|-------------|---------|
  | 概念完成 | `ipd-docx` | CDCP 材料模板 |
  | 计划完成 | `ipd-xlsx` + `ipd-docx` | BOM 成本表 + PDCP 材料 |
  | 开发完成 | `ipd-xlsx` | 项目进度表 |
  | 验证完成 | `ipd-docx` | TR5/TR6 评审材料 + ADCP 材料 |
  | 发布完成 | `ipd-xlsx` | 首批生产计划表 |
  | 生命周期完成 | `ipd-docx` | LDCP 材料 |

### 输入依赖
| 依赖 | 来源 |
|------|------|
| FastAPI app 实例 | M0 |
| 数据库会话 | M0 |
| 配置对象 | M0 |
| 日志 | M0 |
| 认证中间件 | M1 |

### 输出接口
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/workflows/templates` | GET/POST | 模板列表/创建 |
| `/api/workflows/templates/{id}` | GET/PUT/DELETE | 模板详情/更新/删除 |
| `/api/projects` | GET/POST | 项目列表/创建 |
| `/api/projects/{id}` | GET/PUT/DELETE | 项目详情/更新/删除 |
| `/api/projects/{id}/advance` | POST | 推进到下一阶段 |
| `/api/projects/{id}/rollback` | POST | 回退到上一阶段 |
| `/api/projects/{id}/stages` | GET | 当前阶段详情 |
| `/api/projects/{id}/stages/{stage}/activities` | GET | 阶段活动列表（已裁剪） |
| `/api/projects/{id}/stages/{stage}/gates` | GET | 门禁状态 |
| `/api/projects/{id}/stages/{stage}/widgets` | GET | 侧边栏小组件状态 |

---

## 二、M3 — 提示词系统

### 任务清单
- [ ] 6 个 Agent 角色 Jinja2 提示词模板 CRUD + 版本管理
- [ ] 模板渲染（根据项目上下文渲染最终 system prompt）
- [ ] 上下文构建（从项目/阶段/产出物提取上下文变量）
- [ ] 渲染前调用 `data_filter.py` 过滤敏感信息
- [ ] XML 标签包裹（`<user_input>` 防 prompt injection）
- [ ] 系统指令和用户输入结构隔离

### 技能集成任务
- [ ] **模板注入 Skill 调用指令**：
  | Agent 角色 | 可调用的 Skill | 注入位置 |
  |-----------|-------------|---------|
  | `product_manager` | `ipd-docx` | 文档生成相关指令区域 |
  | `rd` | `ipd-xlsx`、`ipd-docx` | 技术文档/BOM 生成区域 |
  | `qa` | `ipd-data-analysis` | 质量数据分析区域 |
  | `marketing` | `ipd-data-analysis` | 市场数据分析区域 |
  | `manufacturing` | `ipd-xlsx` | BOM 和供应链数据区域 |
  | `finance` | `ipd-data-analysis`、`ipd-xlsx` | 财务分析/预算表区域 |
- [ ] **上下文变量扩展**：增加 `skill_*_enabled` 和 `available_skills` 变量
- [ ] **Skill 启用状态集成**：从 M17 配置读取 Skill 启用/禁用状态

### 模板注入示例
```jinja2
{# 在 product_manager 模板中注入 ipd-docx 调用指令 #}
{% if skill_ipd_docx_enabled %}
## 文档生成能力
你可以使用 `ipd-docx` Skill 生成以下文档：
- MRD（市场需求文档）
- PRD（产品需求文档）
- 商业论证文档
当需要生成上述文档时，请使用该 Skill 生成格式规范的 .docx 文件。
{% endif %}
```

### 输入依赖
| 依赖 | 来源 |
|------|------|
| FastAPI app 实例 | M0 |
| 数据库会话 | M0 |
| 日志 | M0 |
| 认证中间件 | M1 |
| data_filter | shared/data_filter.py |

### 输出接口
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/prompts/templates` | GET | 所有提示词模板列表 |
| `/api/prompts/templates/{role}` | GET/PUT | 角色模板详情/更新 |
| `/api/prompts/render` | POST | 渲染 system prompt（内部调用） |
| `render_system_prompt(role, context) -> str` | 函数 | 核心渲染函数 |
| `build_context(project_id, stage) -> dict` | 函数 | 构建渲染上下文 |

---

## 三、M4 — Agent 编排

### 任务清单
- [ ] 3 种编排模式：parallel/sequential/debate
- [ ] 统一 LLM 调用接口（Ollama/Anthropic/OpenAI）
- [ ] LLM Router 自动降级切换
- [ ] 死循环检测（debate 连续 3 轮无新观点终止）
- [ ] 熔断器（连续 5 次失败 → 10 分钟后自动重试）
- [ ] 推理摘要生成（Agent 推理过程中文摘要）
- [ ] Token 管理（max_tokens 截断）
- [ ] 语言检测（非中文 → 重试）
- [ ] JSON 输出解析（失败 2 次 → 纯文本）

### 技能集成任务
- [ ] **活动类型 → Skill 自动调度**：
  | 活动类型 | 触发 Skill | 示例活动 |
  |---------|-----------|---------|
  | `market_analysis` | `ipd-data-analysis` | 竞品分析、TAM/SAM/SOM 估算 |
  | `financial_analysis` | `ipd-data-analysis` | ROI 计算、敏感性分析 |
  | `quality_analysis` | `ipd-data-analysis` | 缺陷率统计、测试通过率 |
  | `bom_generation` | `ipd-xlsx` | 物料清单、成本核算 |
  | `budget_planning` | `ipd-xlsx` | 财务预算表、预算 vs 实际 |
  | `schedule_planning` | `ipd-xlsx` | 项目进度表、甘特图 |
  | `document_generation` | `ipd-docx` | MRD/PRD/技术方案 |
- [ ] **Skill 输出注入**：将 Skill 生成结果注入 Agent 上下文
- [ ] **编排流程扩展**：活动前判断 → 调用 Skill → 注入上下文 → 编排

### 编排流程扩展
```
1. 从 M2 获取当前活动列表
2. 对每个活动，判断是否需要调用 Skill
   ├─ 需要 → 调用对应 Skill 生成数据/文档
   │        └─ 将 Skill 输出注入 Agent 上下文
   └─ 不需要 → 直接进入编排
3. 执行编排模式（parallel/sequential/debate）
4. Agent 推理时使用 Skill 输出作为参考
5. 编排完成后，将结果传递给 M5 保存为产出物
```

### 输入依赖
| 依赖 | 来源 |
|------|------|
| FastAPI app 实例 | M0 |
| 数据库会话 | M0 |
| 认证中间件 | M1 |
| 工作流引擎 | M2 |
| 提示词渲染 | M3 |
| data_filter | shared |

### 输出接口
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/agents/configs` | GET/POST | Agent 配置列表/创建 |
| `/api/agents/configs/{id}` | GET/PUT | Agent 配置详情/更新 |
| `/api/agents/orchestrate` | POST | 触发 Agent 协作 |
| `/api/agents/rounds/{id}` | GET | 获取协作轮次详情 |
| `/api/agents/rounds/{id}/messages` | GET | 获取轮次消息列表 |
| `/api/agents/models` | GET | 可用模型列表 |
| `/api/agents/models/test` | POST | 测试模型连接 |

---

## 四、全局依赖关系

```
M0（基础设施）
  └─→ M1（认证与安全）
       └─→ M2（工作流引擎）→ 输出给 M4
       └─→ M3（提示词系统）→ 输出给 M4
            └─→ M4（Agent 编排）→ 输出给 M5/M6/M8/M9/M10
```

## 五、关键文件

| 模块 | 文件 | 说明 |
|------|------|------|
| M2 | `m2_workflow_engine/engine.py` | 核心引擎 |
| M2 | `m2_workflow_engine/template_service.py` | 模板加载/校验 |
| M2 | `m2_workflow_engine/gate_service.py` | 门禁逻辑 |
| M2 | `m2_workflow_engine/activity_service.py` | 活动裁剪 |
| M2 | `m2_workflow_engine/widget_service.py` | 侧边栏小组件 |
| M2 | `m2_workflow_engine/background_jobs.py` | 后台任务 |
| M3 | `m3_prompt_system/renderer.py` | Jinja2 渲染器 |
| M3 | `m3_prompt_system/context_builder.py` | 上下文构建 |
| M3 | `m3_prompt_system/input_guard.py` | 输入防护 |
| M3 | `m3_prompt_system/templates/` | 6 个角色模板 |
| M4 | `m4_agent_orchestration/orchestrator.py` | 编排器 |
| M4 | `m4_agent_orchestration/executor.py` | Agent 执行器 |
| M4 | `m4_agent_orchestration/llm_router.py` | LLM Router |
| M4 | `m4_agent_orchestration/deadlock_detector.py` | 死循环检测 |
| M4 | `m4_agent_orchestration/circuit_breaker.py` | 熔断器 |

## 六、完成标准

- [ ] M2 全部完成（6 阶段推进、活动裁剪、门禁、回退）
- [ ] M3 全部完成（6 模板、渲染、上下文构建、输入防护）
- [ ] M4 全部完成（3 种编排模式、LLM Router、熔断器、死循环检测）
- [ ] **M2 Skill 集成完成（阶段完成时自动调用对应 Skill）**
- [ ] **M3 Skill 集成完成（6 模板注入 Skill 调用指令）**
- [ ] **M4 Skill 集成完成（活动类型 → Skill 自动调度）**
- [ ] 所有模块测试通过（单元测试覆盖率 ≥ 70%）
- [ ] 所有公开函数有 docstring
- [ ] 所有 SQL 参数化查询

## 七、参考文档

- `docx/architecture-v5.md` — 系统架构设计
- `docx/api-design.md` — API 端点设计
- `docx/database-schema-v3.md` — 数据库 Schema
- `docx/agent-system-prompts.md` — Agent 系统提示词
- `docx/ipd-workflow-template.md` — IPD 工作流模板
- `MVPtext/CLAUDE.md` — 主开发规则
- `.claude/skills/ipd-xlsx/SKILL.md` — Excel 技能包
- `.claude/skills/ipd-docx/SKILL.md` — Word 技能包
- `.claude/skills/ipd-data-analysis/SKILL.md` — 数据分析技能包
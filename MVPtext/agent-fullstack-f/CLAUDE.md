# Agent: 全栈开发 F — 任务分配

> **角色**：全栈开发 F
> **负责模块**：M7（插件系统）、M17（Agent 配置页）、M18（用量与设置）
> **开发周期**：Week 4-7
> **技能使用**：`ipd-data-analysis`（用量分析数据展示）、`ipd-xlsx`（Excel 技能配置）、`ipd-docx`（Word 技能配置）

---

## 一、M7 — 插件系统

### 任务清单
- [ ] 3 个内置插件管理（CRUD + 启用/禁用）
- [ ] 插件清单解析（manifest.json 校验，基于 `plugin-manifest-schema.md`）
- [ ] 插件生命周期（安装/卸载/升级）
- [ ] 插件沙箱（安全隔离：超时 30s、禁止文件系统访问、频率限制 3 次/分钟）
- [ ] 插件市场接口（MVP 仅 1 个内置 web_search 插件）
- [ ] 插件配置加密存储（API Key Fernet 加密）
- [ ] web_search 内置插件实现（搜索互联网获取信息）

### 技能集成任务
- [ ] **技能作为插件的扩展机制**：将 3 个 Skill 通过 `plugin_registry` 注册为 Agent 可调用的 tool
  | 技能 | 插件注册方式 | 注册的 Tool |
  |------|------------|------------|
  | `ipd-data-analysis` | 通过 `plugin_registry` 注册为数据分析工具 | `analyze_data` |
  | `ipd-xlsx` | 通过 `plugin_registry` 注册为 Excel 生成工具 | `generate_xlsx` |
  | `ipd-docx` | 通过 `plugin_registry` 注册为 Word 生成工具 | `generate_docx` |
- [ ] **tool_bridge 实现**：将 Skill 转换为 Agent 可调用的 tool 格式
  ```python
  class SkillTool:
      skill_name: str          # "ipd-data-analysis" | "ipd-xlsx" | "ipd-docx"
      tool_name: str           # Agent 调用时使用的 tool 名称
      description: str         # tool 描述（Agent 理解用途）
      parameters: dict         # JSON Schema 格式的参数定义
      execute: Callable        # 执行函数
  ```
- [ ] **技能调用流程**：Agent 编排 → tool_bridge 路由 → Skill 执行 → 产出物保存到 M5 → 结果返回 Agent
- [ ] **技能启停控制**：根据 M17 配置页的技能开关状态，决定是否注册对应 tool

### 输入依赖
| 依赖 | 来源 |
|------|------|
| FastAPI app 实例 | M0 |
| 数据库会话 | M0 |
| 认证中间件 | M1 |
| Agent 编排 | M4 |

### 输出接口
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/plugins` | GET | 已安装插件列表 |
| `/api/plugins/install` | POST | 安装插件 |
| `/api/plugins/{id}` | GET/PUT/DELETE | 插件详情/配置更新/卸载 |
| `/api/plugins/{id}/toggle` | POST | 启用/禁用插件 |
| `/api/plugins/available` | GET | 可用插件市场列表 |
| `/api/plugins/{id}/test` | POST | 测试插件连接 |

### 关键文件
| 文件 | 说明 |
|------|------|
| `m7_plugin_system/router.py` | 插件路由 |
| `m7_plugin_system/plugin_service.py` | 插件管理业务逻辑 |
| `m7_plugin_system/plugin_registry.py` | 插件注册表 |
| `m7_plugin_system/tool_bridge.py` | 工具桥接：Skill → Agent Tool |
| `m7_plugin_system/manifest_validator.py` | 插件清单校验 |
| `m7_plugin_system/sandbox.py` | 插件调用安全沙箱 |
| `m7_plugin_system/models.py` | Pydantic 模型 |

### 技能使用
| 模块 | 技能 | 用途 |
|------|------|------|
| M7 | `ipd-data-analysis` / `ipd-xlsx` / `ipd-docx` | 通过 tool_bridge 注册为 Agent 可调用的 tool |

---

## 二、M17 — Agent 配置页（前端）

### 任务清单
- [ ] LLM 后端选择器（Ollama/Anthropic/OpenAI 三选一）
- [ ] Ollama 连接配置（base_url 输入 + 可用模型列表获取 + 默认模型选择）
- [ ] API Key 配置面板（Anthropic/OpenAI Key 输入、掩码显示、加密存储）
- [ ] 模型连接测试（发送测试 prompt，显示成功/失败 + 延迟 + Token 数）
- [ ] 6 个 Agent 角色提示词查看/编辑（从 M3 后端获取模板）
- [ ] 提示词渲染预览（预览渲染后的 system prompt）
- [ ] DataExportNotice 集成（配置云端 API 时弹出数据出境告知，必须勾选同意）
- [ ] 模型参数调整（temperature、max_tokens 等）

### 技能集成任务
- [ ] **技能管理面板**：每个 Agent 角色卡片展示可用 Skill 列表
  | Agent 角色 | 可用 Skill | 默认启用 |
  |-----------|-----------|---------|
  | `product_manager`（产品经理） | `ipd-docx` | ✅ 启用 |
  | `rd`（研发架构师） | `ipd-xlsx`、`ipd-docx` | ✅ 启用 |
  | `qa`（测试专家） | `ipd-data-analysis` | ✅ 启用 |
  | `marketing`（市场专家） | `ipd-data-analysis` | ✅ 启用 |
  | `manufacturing`（制造工程师） | `ipd-xlsx` | ✅ 启用 |
  | `finance`（财务分析师） | `ipd-data-analysis`、`ipd-xlsx` | ✅ 启用 |
- [ ] **技能启用/禁用开关**：每个 Skill 配独立开关，状态即时生效
- [ ] **全局技能控制**：页面顶部提供"全局启用所有技能"/"全局禁用所有技能"按钮
- [ ] **技能状态持久化**：技能启用状态通过 API 保存到后端，M7 根据状态决定是否注册 tool

### 输入依赖
| 依赖 | 来源 |
|------|------|
| API 客户端 | shared/api-client.ts |
| AuthContext | M11 |
| 类型定义 | shared/types.ts |
| 后端 M3 | 提示词模板 API |
| 后端 M1 | API Key 管理 API |
| 后端 M7 | 技能状态 API |

### 输出接口
| 输出 | 类型 | 说明 |
|------|------|------|
| `/settings/agents` | Route | Agent 配置页面 |

### 关键文件
| 文件 | 说明 |
|------|------|
| `m17_agent_config/index.tsx` | Agent 配置页入口 |
| `m17_agent_config/components/ModelSelector.tsx` | LLM 模型选择器 |
| `m17_agent_config/components/ApiKeyConfig.tsx` | API Key 配置面板 |
| `m17_agent_config/components/OllamaConfig.tsx` | Ollama 连接配置 |
| `m17_agent_config/components/ModelTestPanel.tsx` | 模型连接测试 |
| `m17_agent_config/components/AgentRoleList.tsx` | Agent 角色列表 |
| `m17_agent_config/components/AgentRoleEditor.tsx` | 角色提示词编辑器 |
| `m17_agent_config/components/PromptPreview.tsx` | 提示词渲染预览 |
| `m17_agent_config/components/ModelParamsPanel.tsx` | 模型参数面板 |
| `m17_agent_config/components/DataExportNotice.tsx` | 数据出境告知弹窗 |
| `m17_agent_config/components/SkillToggle.tsx` | 技能启用/禁用开关 |
| `m17_agent_config/hooks/useAgentConfig.ts` | Agent 配置 Hook |
| `m17_agent_config/hooks/useModelTest.ts` | 模型测试 Hook |
| `m17_agent_config/hooks/useSkillStatus.ts` | 技能状态 Hook |
| `m17_agent_config/api.ts` | Agent 配置 API 调用 |
| `m17_agent_config/types.ts` | Agent 配置相关类型 |

### 技能使用
| 模块 | 技能 | 用途 |
|------|------|------|
| M17 | `ipd-docx` / `ipd-xlsx` / `ipd-data-analysis` | 配置页中展示各 Skill 的启用/禁用开关，管理 Skill 状态 |

---

## 三、M18 — 用量与设置（前端）

### 任务清单
- [ ] UsageOverview（用量概览：总 Token、总成本、调用次数、活跃项目数卡片）
- [ ] 模型分布展示（按 Ollama/Anthropic/OpenAI 分组的 Token 和成本占比）
- [ ] DailyTrendChart（每日 Token 消耗趋势图，Chart.js 柱状图/折线图，最近 30 天）
- [ ] ProjectUsage（项目级用量明细，按项目/阶段/Agent 筛选）
- [ ] UsageLimits（用量限制配置：每日/每月 Token 上限，后端 M9 强制校验）
- [ ] BudgetAlerts（预算预警配置：阈值百分比，超预算通知）
- [ ] GeneralSettings（全局设置：语言、主题、通知开关）
- [ ] DataManagement（数据管理：导出 JSON、清除数据含二次确认输入"DELETE"）
- [ ] AboutPage（关于页面：版本号、开源许可、第三方依赖）

### 技能集成任务
- [ ] **用量分析图表展示**：
  | 展示区域 | 数据来源 | 对应 Skill | 展示方式 |
  |---------|---------|-----------|---------|
  | Token 消耗趋势 | M9 后端按天/周/月统计 | `ipd-data-analysis` | Chart.js 折线图 |
  | 成本分布分析 | M9 后端按模型/项目/Agent 统计 | `ipd-data-analysis` | 饼图/环形图 + 详表 |
  | 预算执行分析 | M9 后端预算 vs 实际对比 | `ipd-data-analysis` | 柱状图 + 进度条 + 超支预警 |
  | 模型效率分析 | M9 后端各模型性价比数据 | `ipd-data-analysis` | 散点图/雷达图 |
  | 用量预测 | 基于历史数据的趋势预测 | `ipd-data-analysis` | 虚线趋势延伸 + 预测值标注 |
- [ ] **"生成用量分析报告"功能**：页面底部提供按钮，调用后端触发 `ipd-data-analysis` Skill 生成 Markdown 报告，报告自动保存到 M5，生成完成后通过 M8 通知前端，用户可在 M16 查看
- [ ] **数据筛选**：支持按日期范围（最近 7 天/30 天/自定义）、按模型、按项目筛选

### 输入依赖
| 依赖 | 来源 |
|------|------|
| API 客户端 | shared/api-client.ts |
| AuthContext | M11 |
| 类型定义 | shared/types.ts |
| 后端 M9 | 用量统计 API |
| 后端 M1 | 设置 API |

### 输出接口
| 输出 | 类型 | 说明 |
|------|------|------|
| `/settings/usage` | Route | 用量统计页 |
| `/settings/general` | Route | 全局设置页 |
| `/settings/about` | Route | 关于页面 |

### 关键文件
| 文件 | 说明 |
|------|------|
| `m18_usage_settings/index.tsx` | 设置模块入口（子路由配置） |
| `m18_usage_settings/components/UsageOverview.tsx` | 用量概览 |
| `m18_usage_settings/components/ProjectUsage.tsx` | 项目用量明细 |
| `m18_usage_settings/components/DailyTrendChart.tsx` | 每日趋势图 |
| `m18_usage_settings/components/UsageLimits.tsx` | 用量限制配置 |
| `m18_usage_settings/components/BudgetAlerts.tsx` | 预算预警配置 |
| `m18_usage_settings/components/GeneralSettings.tsx` | 全局设置 |
| `m18_usage_settings/components/DataManagement.tsx` | 数据管理 |
| `m18_usage_settings/components/AboutPage.tsx` | 关于页面 |
| `m18_usage_settings/components/UsageAnalysisReport.tsx` | 用量分析报告生成按钮 |
| `m18_usage_settings/hooks/useUsage.ts` | 用量数据 Hook |
| `m18_usage_settings/hooks/useSettings.ts` | 设置数据 Hook |
| `m18_usage_settings/hooks/useUsageAnalysis.ts` | 用量分析报告 Hook |
| `m18_usage_settings/api.ts` | 用量和设置 API 调用 |
| `m18_usage_settings/types.ts` | 用量和设置相关类型 |

### 技能使用
| 模块 | 技能 | 用途 |
|------|------|------|
| M18 | `ipd-data-analysis` | 展示用量分析图表（趋势/分布/预算/效率/预测），生成用量分析报告 |

---

## 四、全局依赖关系

```
M0（基础设施）
  └─→ M1（认证与安全）
       └─→ M4（Agent 编排）
            └─→ M7（插件系统）→ 注册 Skill 为 Agent tool
                 └─→ 输出给 M17（技能状态管理）

M17（Agent 配置页）← M3（提示词模板 API）
                  ← M1（API Key 管理 API）
                  ← M7（技能状态 API）

M18（用量与设置）← M9（用量统计 API）
                 ← M1（设置 API）
```

## 五、关键文件

| 模块 | 文件 | 说明 |
|------|------|------|
| M7 | `m7_plugin_system/router.py` | 插件路由 |
| M7 | `m7_plugin_system/plugin_service.py` | 插件管理业务逻辑 |
| M7 | `m7_plugin_system/plugin_registry.py` | 插件注册表 |
| M7 | `m7_plugin_system/tool_bridge.py` | 工具桥接：Skill → Agent Tool |
| M7 | `m7_plugin_system/manifest_validator.py` | 插件清单校验 |
| M7 | `m7_plugin_system/sandbox.py` | 插件调用安全沙箱 |
| M7 | `m7_plugin_system/models.py` | Pydantic 模型 |
| M17 | `m17_agent_config/index.tsx` | Agent 配置页入口 |
| M17 | `m17_agent_config/components/ModelSelector.tsx` | LLM 模型选择器 |
| M17 | `m17_agent_config/components/ApiKeyConfig.tsx` | API Key 配置面板 |
| M17 | `m17_agent_config/components/OllamaConfig.tsx` | Ollama 连接配置 |
| M17 | `m17_agent_config/components/AgentRoleEditor.tsx` | 角色提示词编辑器 |
| M17 | `m17_agent_config/components/SkillToggle.tsx` | 技能启用/禁用开关 |
| M17 | `m17_agent_config/components/DataExportNotice.tsx` | 数据出境告知弹窗 |
| M17 | `m17_agent_config/hooks/useSkillStatus.ts` | 技能状态 Hook |
| M18 | `m18_usage_settings/components/UsageOverview.tsx` | 用量概览 |
| M18 | `m18_usage_settings/components/DailyTrendChart.tsx` | 每日趋势图 |
| M18 | `m18_usage_settings/components/UsageLimits.tsx` | 用量限制配置 |
| M18 | `m18_usage_settings/components/GeneralSettings.tsx` | 全局设置 |
| M18 | `m18_usage_settings/components/UsageAnalysisReport.tsx` | 用量分析报告生成 |
| M18 | `m18_usage_settings/hooks/useUsageAnalysis.ts` | 用量分析报告 Hook |

## 六、完成标准

- [ ] M7 全部完成（插件 CRUD、web_search 内置插件、清单校验、安全沙箱）
- [ ] M17 全部完成（LLM 选择器、API Key 管理、Ollama 配置、角色提示词编辑器、模型测试）
- [ ] M18 全部完成（用量概览、趋势图、用量限制、预算预警、全局设置、数据导出）
- [ ] **M7 tool_bridge 完成：3 个 Skill 成功注册为 Agent 可调用的 tool**
- [ ] **M7 技能调用流程通过：编排 → tool_bridge → Skill → M5 保存 → 返回结果**
- [ ] **M17 技能管理面板完成：每个 Agent 角色正确显示可用 Skill 列表 + 启用/禁用开关**
- [ ] **M17 技能状态持久化：技能启用/禁用状态通过 API 保存，M7 即时生效**
- [ ] **M18 用量分析图表正确展示 `ipd-data-analysis` 生成的数据**
- [ ] **M18"生成用量分析报告"功能可用，报告可查看**
- [ ] 所有模块测试通过（单元测试覆盖率 ≥ 70%）
- [ ] 所有公开函数有 docstring/JSDoc
- [ ] API Key 加密存储，日志无敏感信息
- [ ] DataExportNotice 在配置云端 API 时正确弹出，必须勾选同意

## 七、参考文档

- `docx/api-design.md` — API 端点设计
- `docx/database-schema-v3.md` — 数据库 Schema
- `docx/plugin-manifest-schema.md` — 插件清单 Schema
- `docx/security-architecture-v2.md` — 安全架构设计
- `MVPtext/CLAUDE.md` — 主开发规则
- `MVPtext/backend/m7-plugin-system/CLAUDE.md` — M7 模块详情
- `MVPtext/frontend/m17-agent-config/CLAUDE.md` — M17 模块详情
- `MVPtext/frontend/m18-usage-settings/CLAUDE.md` — M18 模块详情
- `.claude/skills/ipd-data-analysis/SKILL.md` — 数据分析技能包
- `.claude/skills/ipd-xlsx/SKILL.md` — Excel 技能包
- `.claude/skills/ipd-docx/SKILL.md` — Word 技能包
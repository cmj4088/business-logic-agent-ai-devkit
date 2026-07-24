# Agent: 全栈开发 C — 任务分配

> **角色**：全栈开发 C
> **负责模块**：M5（产出物管理）、M6（审核系统）、M8（实时通信）、M9（用量追踪）
> **开发周期**：Week 3-6
> **技能使用**：`ipd-data-analysis`（审核统计/用量分析）、`ipd-xlsx`（Excel 交付物）、`ipd-docx`（Word 交付物）

---

## 一、M5 — 产出物管理

### 任务清单
- [ ] 18 种产出物类型 CRUD
- [ ] 版本管理（每次修改创建新版本，旧版本保留只读）
- [ ] Markdown 渲染（存储/渲染）
- [ ] 附件管理（上传/下载/删除，最大 50MB，magic bytes 校验）
- [ ] AIBadge 数据（AI 生成标识 + 可信度）
- [ ] Agent 编排完成后自动创建/更新对应产出物

### 技能集成任务
- [ ] **产出物类型 → Skill 映射**：
  | 产出物 | 格式 | Skill |
  |--------|------|-------|
  | MRD | .docx | `ipd-docx` |
  | PRD | .docx | `ipd-docx` |
  | 系统架构设计文档 | .docx | `ipd-docx` |
  | BOM 与成本估算 | .xlsx | `ipd-xlsx` |
  | PDCP 材料 | .docx + .xlsx | `ipd-docx` + `ipd-xlsx` |
  | 详细设计文档 | .docx | `ipd-docx` |
  | 单元测试报告 | .xlsx | `ipd-xlsx` |
  | TR4 评审报告 | .docx | `ipd-docx` |
  | 测试用例集 | .xlsx | `ipd-xlsx` |
  | 系统测试报告 | .docx | `ipd-docx` |
  | TR5/TR6 评审报告 | .docx | `ipd-docx` |
  | ADCP 材料 | .docx | `ipd-docx` |
  | GTM 执行计划 | .docx | `ipd-docx` |
  | 首批生产报告 | .xlsx | `ipd-xlsx` |
  | 运营评审报告 | .docx | `ipd-docx` |
- [ ] **生成流程**：M4 编排完成 → 判断产出物类型 → 调用对应 Skill 生成文件 → 存储为附件 → 记录 AIBadge → 创建版本

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
| `/api/artifacts` | GET | 项目产出物列表 |
| `/api/artifacts/{id}` | GET | 产出物详情 |
| `/api/artifacts/{id}/versions` | GET | 版本历史 |
| `/api/artifacts/{id}/versions/{version}` | GET | 特定版本内容 |
| `/api/artifacts/{id}` | PUT | 更新产出物（创建新版本） |
| `/api/artifacts/{id}/attachments` | POST | 上传附件 |
| `/api/artifacts/{id}/attachments/{file_id}` | GET/DELETE | 下载/删除附件 |
| `/api/artifacts/types` | GET | 产出物类型列表 |

---

## 二、M6 — 审核系统

### 任务清单
- [ ] DCP/TR 门禁投票机制
- [ ] 单人模式（自动通过 + 标注"自动通过，未经人工实质审查"）
- [ ] 审核升级（门禁失败后升级路径）
- [ ] 遗留问题追踪（关注级 exit criteria 未完成）
- [ ] 审核仪表盘数据（跨项目聚合待处理审核事项）
- [ ] 行业合规提示（根据项目行业显示合规提醒）

### 技能集成任务
- [ ] **审核统计数据生成**：通过 `ipd-data-analysis` 生成：
  | 分析类型 | 用途 | 数据来源 |
  |---------|------|---------|
  | 审核通过率统计 | 各阶段/门禁通过率 | `gate_results` 表 |
  | 门禁趋势分析 | 按时间维度分析通过趋势 | `gate_results` + `stage_states` |
  | 遗留问题分布 | 按阶段/类型统计 | `stage_checklist_items` 表 |
  | 行业合规统计 | 合规提醒触发频率 | 项目行业配置 |

### 输入依赖
| 依赖 | 来源 |
|------|------|
| FastAPI app 实例 | M0 |
| 数据库会话 | M0 |
| 认证中间件 | M1 |
| 工作流引擎 | M2 |
| 产出物管理 | M5 |

### 输出接口
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/reviews` | GET | 审核列表 |
| `/api/reviews/dashboard` | GET | 审核仪表盘聚合数据 |
| `/api/reviews/{id}` | GET | 审核详情 |
| `/api/reviews/{id}/vote` | POST | 提交投票 |
| `/api/reviews/batch` | POST | 批量审核 |
| `/api/reviews/{id}/escalate` | POST | 审核升级 |
| `/api/reviews/issues` | GET | 遗留问题列表 |

---

## 三、M8 — 实时通信

### 任务清单
- [ ] WebSocket 5 通道管理（agent/stage/widgets/notifications/messages）
- [ ] 连接管理（连接/断开/心跳/重连）
- [ ] 消息广播和路由
- [ ] 降级轮询（WebSocket 不可用时 fallback 到 HTTP 轮询）
- [ ] 认证校验（token 验证）

### 技能集成任务
- [ ] **Skill 执行进度实时推送**：
  | 推送场景 | WebSocket 通道 | 推送内容 |
  |---------|---------------|---------|
  | Skill 开始执行 | `agent` | `{type: "skill_start", skill_name, agent_role}` |
  | Skill 执行进度 | `agent` | `{type: "skill_progress", skill_name, progress: 0-100}` |
  | Skill 产出物就绪 | `agent` | `{type: "skill_complete", skill_name, artifact_id, artifact_type}` |
  | Skill 产出物更新 | `notifications` | `{type: "artifact_updated", artifact_id, version}` |
  | Skill 执行失败 | `agent` | `{type: "skill_error", skill_name, error_message}` |
- [ ] **通知推送扩展**：增加 `skill_complete` / `skill_artifact_ready` / `skill_error` 通知类型

### 输入依赖
| 依赖 | 来源 |
|------|------|
| FastAPI app 实例 | M0 |
| 认证中间件 | M1 |
| Agent 编排 | M4 |

### 输出接口
| 接口 | 类型 | 说明 |
|------|------|------|
| `/ws/agent/{project_id}` | WebSocket | Agent 流式输出通道 |
| `/ws/stage/{project_id}` | WebSocket | 阶段状态变更通道 |
| `/ws/widgets/{project_id}` | WebSocket | 侧边栏小组件状态通道 |
| `/ws/notifications` | WebSocket | 全局通知通道 |
| `/ws/messages/{round_id}` | WebSocket | 消息流式通道 |
| `/api/sse/messages/{round_id}` | SSE | 消息流式传输（降级方案） |
| `/api/dashboard` | GET | Dashboard 聚合数据 |

---

## 四、M9 — 用量追踪

### 任务清单
- [ ] Token 消耗统计（每次 LLM 调用记录 token 用量）
- [ ] 成本统计（按模型单价计算成本）
- [ ] 项目级/全局级用量汇总
- [ ] 预算预警（超预算自动通知）
- [ ] 每日趋势数据

### 技能集成任务
- [ ] **用量数据统计分析**：通过 `ipd-data-analysis` 生成：
  | 分析类型 | 用途 | 数据来源 |
  |---------|------|---------|
  | Token 消耗趋势 | 按天/周/月分析 | `usage_records` 表 |
  | 成本分布分析 | 按模型/项目/Agent 分析 | `usage_records` + `cost_rates` |
  | 预算执行分析 | 预算 vs 实际，预测超支风险 | `budget` + `actual_cost` |
  | 模型效率分析 | 性价比分析 | `usage_records` + `quality_scores` |

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
| `/api/usage/projects/{id}` | GET | 项目用量统计 |
| `/api/usage/summary` | GET | 全局用量摘要 |
| `/api/usage/daily` | GET | 每日用量趋势 |
| `/api/usage/limits` | GET/PUT | 用量限制配置 |

---

## 五、全局依赖关系

```
M0（基础设施）
  └─→ M1（认证与安全）
       └─→ M4（Agent 编排）
            └─→ M5（产出物管理）→ 输出给 M6
            └─→ M6（审核系统）→ 输出给 M15
            └─→ M8（实时通信）→ 输出给 M12/M14a/M14b
            └─→ M9（用量追踪）→ 输出给 M12/M18
```

## 六、关键文件

| 模块 | 文件 | 说明 |
|------|------|------|
| M5 | `m5_artifact_management/artifact_service.py` | 产出物业务逻辑 |
| M5 | `m5_artifact_management/version_service.py` | 版本管理 |
| M5 | `m5_artifact_management/attachment_service.py` | 附件管理 |
| M5 | `m5_artifact_management/artifact_types.py` | 18 种产出物类型 |
| M6 | `m6_review_system/review_service.py` | 审核业务逻辑 |
| M6 | `m6_review_system/vote_service.py` | 投票逻辑 |
| M6 | `m6_review_system/escalation_service.py` | 审核升级 |
| M6 | `m6_review_system/issue_tracker.py` | 遗留问题追踪 |
| M6 | `m6_review_system/dashboard_service.py` | 审核仪表盘数据 |
| M8 | `m8_realtime_communication/connection_manager.py` | WebSocket 连接管理 |
| M8 | `m8_realtime_communication/agent_stream.py` | Agent 流式输出 |
| M8 | `m8_realtime_communication/stage_broadcaster.py` | 阶段状态广播 |
| M8 | `m8_realtime_communication/notification_pusher.py` | 通知推送 |
| M9 | `m9_usage_tracking/usage_service.py` | 用量统计 |
| M9 | `m9_usage_tracking/token_counter.py` | Token 计数 |
| M9 | `m9_usage_tracking/cost_calculator.py` | 成本计算 |
| M9 | `m9_usage_tracking/budget_alerter.py` | 预算预警 |

## 七、完成标准

- [ ] M5 全部完成（18 种产出物 CRUD、版本管理、附件、AIBadge）
- [ ] M6 全部完成（门禁投票、单人模式、升级、遗留问题追踪）
- [ ] M8 全部完成（5 个 WebSocket 通道、心跳、重连、降级）
- [ ] M9 全部完成（Token 统计、成本计算、预算预警、用量限制）
- [ ] **M5 Skill 集成完成（Word/Excel 产出物自动调用对应 Skill 生成）**
- [ ] **M6 Skill 集成完成（审核统计数据通过 `ipd-data-analysis` 生成）**
- [ ] **M8 Skill 集成完成（Skill 执行进度实时推送前端）**
- [ ] **M9 Skill 集成完成（用量分析数据通过 `ipd-data-analysis` 生成）**

## 八、参考文档

- `docx/api-design.md` — API 端点设计
- `docx/database-schema-v3.md` — 数据库 Schema
- `MVPtext/CLAUDE.md` — 主开发规则
- `.claude/skills/ipd-xlsx/SKILL.md` — Excel 技能包
- `.claude/skills/ipd-docx/SKILL.md` — Word 技能包
- `.claude/skills/ipd-data-analysis/SKILL.md` — 数据分析技能包
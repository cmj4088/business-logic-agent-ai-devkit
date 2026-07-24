# M2: 工作流引擎 — CLAUDE.md

> **模块编号**：M2
> **模块名称**：工作流引擎
> **负责 Agent**：后端开发 B
> **开发周期**：Week 1-4
> **上游依赖**：M0（基础设施）、M1（认证安全）
> **下游被依赖**：M4（Agent 编排）、M6（审核系统）、M13（项目创建）、M14a（项目骨架）

---

## 职责范围

M2 是系统的核心引擎，负责：
1. **模板管理**：加载 `standard_ipd_v3.json` 工作流模板，CRUD
2. **项目创建**：基于模板创建项目实例，复杂度自动判定
3. **阶段推进**：6 阶段顺序推进（概念→计划→开发→验证→发布→生命周期）
4. **活动裁剪**：根据复杂度（lite/standard/full）过滤活动列表
5. **门禁评审**：DCP/TR 系列门禁的触发和通过判定
6. **Exit Criteria 检查**：阻断级（必须过）+ 关注级（提醒不阻塞）
7. **后台任务**：阶段完成时自动触发成本核算（bg_cost_accounting）
8. **侧边栏小组件**：供应链/认证/竞品/预算状态推送
9. **阶段回退**：支持回退到上一阶段重新执行

---

## 输入依赖

| 依赖 | 来源 | 用途 |
|------|------|------|
| FastAPI app 实例 | M0 | 注册路由 |
| 数据库会话 | M0 | 模板和实例 CRUD |
| 配置对象 | M0 | 默认配置（超时、最大回退次数等） |
| 日志 | M0 | 阶段推进日志 |
| 认证中间件 | M1 (`get_current_user`) | 用户身份校验 |

---

## 输出接口

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

## 关键文件

| 文件 | 说明 |
|------|------|
| `router.py` | 模板和项目路由 |
| `template_service.py` | 模板加载/校验/裁剪 |
| `engine.py` | 核心引擎：阶段推进、活动裁剪、门禁判定 |
| `gate_service.py` | 门禁逻辑：exit criteria 分级检查 |
| `activity_service.py` | 活动裁剪和可见性管理 |
| `widget_service.py` | 侧边栏小组件状态管理 |
| `background_jobs.py` | 后台任务：阶段成本核算 |
| `models.py` | Pydantic 模型 |

---

## 核心算法

### 复杂度自动判定
```
if product_type in ("medical", "automotive", "aerospace") → full
elif certification_count >= 3 → full
elif team_size <= 3 and bom_items <= 20 and no_hardware → lite
else → standard
```

### 活动裁剪
- 根据 `visibility.show_in_tiers` 过滤
- lite: 24 活动, standard: 31 活动, full: 34 活动

### Exit Criteria 分级
- 阻断级（3-4 条）：全部通过才允许推进
- 关注级：不阻塞推进，遗留问题记录到下一门禁

---

## 数据库表

- `workflow_templates`：工作流模板
- `workflow_instances`：工作流实例
- `projects`：项目表
- `stage_states`：阶段状态
- `stage_checklist_items`：阶段检查项
- `gate_results`：门禁结果
- `activity_states`：活动状态

---

## 技能集成

### 可调用的 Skill
- **`ipd-xlsx`**：在阶段推进时自动生成 BOM 成本表、项目进度表、财务预算表
- **`ipd-docx`**：在阶段完成时生成阶段评审文档模板（PDCP/ADCP/LDCP 材料）

### 触发时机
| 阶段 | 触发事件 | 调用的 Skill | 生成内容 |
|------|---------|-------------|---------|
| 概念 | 阶段完成 | `ipd-docx` | 概念决策评审（CDCP）材料模板 |
| 计划 | 阶段完成 | `ipd-xlsx` + `ipd-docx` | BOM 成本表 + PDCP 材料 |
| 开发 | 阶段完成 | `ipd-xlsx` | 项目进度表 |
| 验证 | 阶段完成 | `ipd-docx` | TR5/TR6 评审材料 + ADCP 材料 |
| 发布 | 阶段完成 | `ipd-xlsx` | 首批生产计划表 |
| 生命周期 | 阶段完成 | `ipd-docx` | LDCP 材料 |

---

## 完成标准

- [ ] 能加载 `standard_ipd_v3.json` 并解析为完整流程
- [ ] 能创建项目并自动判定复杂度（lite/standard/full）
- [ ] 6 阶段按序推进，门禁通过后才能进入下一阶段
- [ ] 活动裁剪正确（lite 24 个，standard 31 个，full 34 个）
- [ ] 阻断级 exit criteria 全部通过才允许推进
- [ ] 关注级 exit criteria 不阻塞推进
- [ ] 阶段回退功能可用（最多 2 次）
- [ ] 后台任务在阶段完成时自动触发
- [ ] 侧边栏小组件（供应链/认证/竞品/预算）状态正确推送
- [ ] 阶段完成时自动调用 Skill 生成对应阶段文档模板

---

## 禁止事项

1. **禁止跳过门禁直接推进阶段**（即使单人模式也要记录"自动通过"）
2. **禁止硬编码活动列表**（必须从模板 JSON 读取）
3. **禁止忽略复杂度裁剪**（所有用户看到的必须是裁剪后的活动）
4. **禁止回退超过 2 次**（配置 max_rollback_count）
5. **禁止在未完成当前阶段时推进**（阻断级 exit criteria 必须全部通过）
6. **禁止修改模板 JSON 原始文件**（运行时修改保存在实例快照中）

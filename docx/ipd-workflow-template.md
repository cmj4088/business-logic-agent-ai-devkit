# IPD 工作流模板设计 v3 — standard_ipd.json

> **v2 → v3 变更摘要**（基于一线用户视角评审）
>
> | # | 问题 | 修正 |
> |---|------|------|
> | 一 | 44 个活动不分项目大小 | 引入三级复杂度（lite/standard/full），自动裁剪活动集 |
> | 二 | 阶段成本核算重复 6 次像交作业 | 改为后台自动任务（background_jobs），只在超预算时提醒 |
> | 三 | 人工输入活动卡流程 | 全部加 skip/auto-pass/delegate 三种放行方式 |
> | 四 | 概念阶段 7 个活动太重 | lite 模式砍到 3 个核心活动，standard 6 个，full 保留全部 |
> | 五 | 并行分支 + 重复活动一团乱麻 | 供应链跟踪/认证测试/竞品监控改为侧边栏小组件，不占主活动流 |
> | 六 | exit criteria 太多通过感弱 | 分两级：阻断级（3-4条，不过不能走）+ 关注级（提醒但不阻塞） |

---

## 一、模板概述

`standard_ipd.json` 是 Business Logic Agent 系统内置的 **IPD 模板**。工作流引擎读取它来驱动阶段推进、门禁评审、Agent 协作和产出物管理。

**v3 核心设计原则**：
- 项目分级：不是所有产品都需要 44 个活动。复杂度决定流程深度。
- 自动优先：能后台跑的不要出现在用户面前。
- 可跳过：需要人工输入的活动必须有"跳过本次"出口。
- 阻断 vs 关注：只有真正卡流程的才叫阻断级标准。

---

## 二、顶层结构

```json
{
  "workflow_id": "standard_ipd_v3",
  "name": "标准IPD流程",
  "category": "产品研发",
  "version": "3.0.0",
  "description": "基于华为/IPD方法论，支持三级复杂度裁剪（lite/standard/full），重复任务自动化，人工输入可跳过",
  "complexity_tiers": {},
  "stages": [],
  "stage_edges": [],
  "gates": [],
  "roles": [],
  "artifacts": [],
  "activities": [],
  "background_jobs": [],
  "sidebar_widgets": [],
  "defaults": {}
}
```

### 新增顶层字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `complexity_tiers` | object | 三级复杂度定义，决定活动裁剪规则 |
| `background_jobs` | array | 后台自动执行的任务（用户不可见，异常时才提醒） |
| `sidebar_widgets` | array | 侧边栏小组件（持续监控但不占主活动流） |

---

## 三、复杂度分级（核心新增）

### 3.1 三级定义

```json
{
  "complexity_tiers": {
    "lite": {
      "label": "轻量模式",
      "description": "适合 ODM 贴牌、配件、简单迭代——2-4 周概念，8-12 周全流程",
      "applicable_when": "产品不含认证需求 AND 团队 <= 3人 AND BOM <= 20项 AND 无硬件开发",
      "stage_count": 6,
      "activity_count": 18,
      "disabled_activities": [
        "act_concept_3", "act_concept_4",
        "act_plan_2", "act_plan_5", "act_plan_7", "act_plan_8",
        "act_dev_4", "act_dev_5", "act_dev_6", "act_dev_7",
        "act_verify_2", "act_verify_5",
        "act_lifecycle_2", "act_lifecycle_5"
      ],
      "disabled_gate_criteria": ["certification", "supply_chain_risk"],
      "background_jobs_only": ["cost_accounting"],
      "sidebar_widgets_disabled": ["supply_chain_monitor", "certification_tracker"]
    },
    "standard": {
      "label": "标准模式",
      "description": "适合大多数消费电子产品——3-6 个月全流程",
      "applicable_when": "有认证需求 OR 团队 4-10人 OR BOM 21-100项",
      "stage_count": 6,
      "activity_count": 30,
      "disabled_activities": [
        "act_concept_3",
        "act_dev_5",
        "act_verify_2",
        "act_lifecycle_5"
      ],
      "disabled_gate_criteria": [],
      "background_jobs_only": ["cost_accounting"],
      "sidebar_widgets_disabled": []
    },
    "full": {
      "label": "完整模式",
      "description": "适合医疗器械、汽车电子、航空——需严格合规和完整审计追踪",
      "applicable_when": "产品类型 in ['medical', 'automotive', 'aerospace'] OR 认证 >= 3项",
      "stage_count": 6,
      "activity_count": 30,
      "disabled_activities": [],
      "disabled_gate_criteria": [],
      "background_jobs_only": ["cost_accounting"],
      "sidebar_widgets_disabled": []
    }
  }
}
```

### 3.2 复杂度自动判定规则

引擎在项目创建时根据以下条件自动推荐复杂度，用户可手动覆盖：

```
if product_type in ("medical", "automotive", "aerospace") → full
elif certification_count >= 3 → full
elif team_size <= 3 and bom_items <= 20 and no_hardware → lite
else → standard
```

---

## 四、活动可见性模型

每个活动新增 `visibility` 字段：

```json
{
  "id": "act_xxx",
  "visibility": {
    "show_in_tiers": ["standard", "full"],
    "show_in_lite": false,
    "can_be_skipped": true,
    "skip_requires_note": false
  }
}
```

| 字段 | 说明 |
|------|------|
| `show_in_tiers` | 哪些复杂度显示此活动 |
| `can_be_skipped` | 用户是否可以手动跳过（不依赖复杂度自动隐藏） |
| `skip_requires_note` | 跳过时是否需要填写原因 |

---

## 五、人工输入活动的放行机制

所有 `human_input_required: true` 的活动增加三种放行方式，**不再阻塞流程**：

```json
{
  "id": "act_xxx",
  "human_input_required": true,
  "human_input_prompt": "...",
  "bypass_options": {
    "skip_this_time": {
      "label": "跳过本次",
      "description": "这次不提供数据，Agent 基于已有信息继续",
      "requires_note": false
    },
    "auto_pass_until_anomaly": {
      "label": "自动通过直到异常",
      "description": "后续重复触发时不弹窗，Agent 自动标记为'未更新'，仅检测到风险变化时提醒",
      "requires_note": false,
      "available_for_repeating": true
    },
    "delegate_to_agent": {
      "label": "让 Agent 自己查",
      "description": "Agent 尝试从已连接的插件/数据源自动获取信息",
      "requires_note": false
    }
  }
}
```

### 四种人工输入活动的具体表现

| 活动 | 重复频率 | 快速模式下 | 用户操作 |
|------|---------|-----------|---------|
| 客户需求调研 | 一次 | 出现但可跳过 | 上传数据 / 跳过 / 让 Agent 查 CRM |
| 供应链持续跟踪 | 每两周 | 不出现，转为侧边栏小组件 | 只在风险变化时弹提醒 |
| 认证测试执行 | 每周(full) | standard 不出现，full 转为侧边栏 | 只在认证失败时弹提醒 |
| Beta 客户反馈 | 一次 | 出现但可跳过 | 上传数据 / 跳过 / 让 Agent 查问卷平台 |

---

## 六、成本核算改为后台任务

"阶段成本核算"从主活动列表移除，改为 `background_jobs`：

```json
{
  "background_jobs": [
    {
      "id": "bg_cost_accounting",
      "name": "阶段成本核算",
      "trigger": "stage_completed",
      "executor": "finance",
      "description": "每个阶段结束时 finance Agent 自动核算本阶段花费，更新 budget_tracker 和 cash_flow_timeline。用户无感知。",
      "silent": true,
      "alert_condition": "budget_deviation_percent > {{ budget_deviation_alert_percent }}",
      "alert_message": "⚠️ {{ stage_name }} 预算偏差 {{ deviation }}%，超出阈值 {{ threshold }}%",
      "alert_action": "查看偏差详情"
    }
  ]
}
```

**用户看到的变化：**
- 阶段完成后，系统自动核算，不弹出任何界面
- 如果偏差 < 15%：什么都没发生，流程继续
- 如果偏差 >= 15%：弹一条提醒，附带偏差分析链接

---

## 七、重复监控活动改为侧边栏小组件

供应链跟踪、认证测试、竞品监控不再出现在主活动流中，改为侧边栏小组件：

```json
{
  "sidebar_widgets": [
    {
      "id": "widget_supply_chain",
      "name": "供应链状态",
      "icon": "truck",
      "description": "关键物料供应状态实时监控",
      "visible_in_stages": ["develop", "verify", "launch"],
      "visible_in_tiers": ["standard", "full"],
      "refresh_interval": "biweekly",
      "executor": "manufacturing",
      "status_levels": {
        "green": "所有关键物料正常",
        "yellow": "有物料交期延长或价格波动",
        "red": "有物料停产或断供风险"
      },
      "on_status_change": "notify_project_owner",
      "expandable_detail": "点击展开查看各物料状态详情"
    },
    {
      "id": "widget_certification",
      "name": "认证进度",
      "icon": "shield",
      "description": "认证测试进度跟踪",
      "visible_in_stages": ["verify"],
      "visible_in_tiers": ["full"],
      "refresh_interval": "weekly",
      "executor": "rd",
      "status_levels": {
        "green": "所有认证按计划进行",
        "yellow": "有认证项目进度滞后",
        "red": "有认证测试失败"
      },
      "on_status_change": "notify_project_owner",
      "expandable_detail": "点击展开查看各认证项目进度"
    },
    {
      "id": "widget_competitor",
      "name": "竞品动态",
      "icon": "eye",
      "description": "竞品市场动作监控",
      "visible_in_stages": ["lifecycle"],
      "visible_in_tiers": ["standard", "full"],
      "refresh_interval": "monthly",
      "executor": "marketing",
      "status_levels": {
        "green": "竞品无重大动作",
        "yellow": "竞品有值得关注的动作",
        "red": "竞品动作可能威胁产品地位"
      },
      "on_status_change": "notify_project_owner",
      "expandable_detail": "点击展开查看竞品动态简报"
    },
    {
      "id": "widget_budget",
      "name": "预算健康度",
      "icon": "dollar-sign",
      "description": "全流程预算 vs 实际实时对比",
      "visible_in_stages": ["plan", "develop", "verify", "launch", "lifecycle"],
      "visible_in_tiers": ["lite", "standard", "full"],
      "refresh_interval": "stage_end",
      "executor": "finance",
      "status_levels": {
        "green": "预算偏差 < 10%",
        "yellow": "预算偏差 10-15%",
        "red": "预算偏差 > 15%"
      },
      "on_status_change": "notify_project_owner",
      "expandable_detail": "点击展开查看各阶段花费明细 vs 预算"
    }
  ]
}
```

**用户看到的：** 主界面右侧一个小面板，显示 4 个状态灯。大多数时候是绿色的，不用管。变黄或变红了才点进去看。

---

## 八、Exit Criteria 分级

每个阶段的 exit criteria 拆成两级：

```json
{
  "id": "concept",
  "exit_criteria": {
    "blocking": [
      {"id": "c_block_1", "description": "CDCP 决策评审通过", "checked_by": "product_manager"},
      {"id": "c_block_2", "description": "MRD 已完成并审核", "checked_by": "product_manager"},
      {"id": "c_block_3", "description": "初步商业论证通过（ROI 为正）", "checked_by": "finance"}
    ],
    "advisory": [
      {"id": "c_adv_1", "description": "目标市场已明确", "checked_by": "marketing"},
      {"id": "c_adv_2", "description": "合规预评估已完成", "checked_by": "rd"}
    ]
  },
  "allow_advance_with_advisory_open": true,
  "max_advisory_open": 5
}
```

### 各阶段阻断级标准（精简到 3-4 条）

| 阶段 | 阻断级（必须过） | 关注级（提醒不过不阻塞） |
|------|-----------------|------------------------|
| 概念 | CDCP + MRD + 商业论证 ROI>0 | 市场明确、合规预评估 |
| 计划 | PDCP + PRD + 系统设计 + 风险登记册 | BOM估算、合规计划、供应链评估 |
| 开发 | TR3 + TR4 + 集成测试 + BOM成本确认 | DFM审查、认证样机、供应链状态 |
| 验证 | TR5 + TR6 + ADCP + 系统测试通过 | 可靠性测试、认证测试、Beta反馈 |
| 发布 | 首批生产完成 + GTM执行 + 销售渠道开通 | 客服培训、上市公告 |
| 生命周期 | LDCP 决策完成 | 运营报告、竞品简报、迭代清单 |

**关键设计**：`allow_advance_with_advisory_open: true` — 关注级标准没完成也可以推进，但要记录"带着什么问题前进"。下一个门禁会检查遗留问题是否已关闭。

---

## 九、概念阶段快速模式

lite 模式下概念阶段只保留 3 个核心活动：

```
概念阶段 (lite)              概念阶段 (standard)          概念阶段 (full)
──────────────              ──────────────────          ──────────────────
1. 客户需求调研             1. 客户需求调研              1. 客户需求调研
   [可跳过/让Agent查]          [可跳过/让Agent查]           [可跳过/让Agent查]
2. 商业论证                 2. 竞品分析                  2. 竞品分析
   [只做1轮]                3. 初步技术可行性评估         3. 合规预评估
3. MRD 撰写                 4. 商业论证                  4. 初步技术可行性评估
   [精简版]                    [2轮]                     5. 商业论证 [3轮]
                            5. MRD 撰写                 6. MRD 撰写
                            6. 竞品分析                 7. 竞品分析
                            (合规/技术评估移到计划阶段)
```

### 概念阶段活动定义（v3 精简版）

```json
{
  "id": "concept",
  "name": "概念阶段",
  "sequence": 1,
  "description": "回答'这个产品值得做吗'。lite 模式 3 个活动即可启动。",
  "duration_guide": {"lite": "1-2 周", "standard": "2-3 周", "full": "3-4 周"},
  "exit_criteria": {
    "blocking": [
      {"id": "c_block_1", "description": "CDCP 决策评审通过", "checked_by": "product_manager"},
      {"id": "c_block_2", "description": "MRD 已完成并审核", "checked_by": "product_manager"},
      {"id": "c_block_3", "description": "初步商业论证通过（ROI 预测为正）", "checked_by": "finance"}
    ],
    "advisory": [
      {"id": "c_adv_1", "description": "目标市场已明确", "checked_by": "marketing"},
      {"id": "c_adv_2", "description": "合规预评估已完成", "checked_by": "rd"}
    ]
  },
  "allow_advance_with_advisory_open": true,
  "max_advisory_open": 2,
  "activities": [
    {
      "id": "act_concept_1",
      "name": "客户需求调研",
      "description": "收集真实客户需求数据——问卷、访谈、售后记录。lite 模式可直接跳过或用 Agent 推测。",
      "visibility": {"show_in_tiers": ["lite", "standard", "full"], "can_be_skipped": true, "skip_requires_note": true},
      "agent_rounds": {
        "type": "sequential",
        "agents": ["product_manager", "marketing"],
        "moderator": "product_manager",
        "max_rounds": {"lite": 1, "standard": 2, "full": 2},
        "output": "客户需求摘要"
      },
      "human_input_required": true,
      "human_input_prompt": "请上传客户数据（可选）——访谈记录、问卷结果、售后投诉、CRM 导出",
      "bypass_options": {
        "skip_this_time": {"label": "跳过本次", "description": "Agent 基于公开信息推测客户需求"},
        "delegate_to_agent": {"label": "让 Agent 自己查", "description": "Agent 尝试从已连接的数据源获取"}
      }
    },
    {
      "id": "act_concept_2",
      "name": "竞品分析",
      "description": "分析主要竞品的功能、定价、市场策略",
      "visibility": {"show_in_tiers": ["standard", "full"], "can_be_skipped": true},
      "agent_rounds": {
        "type": "parallel",
        "agents": ["product_manager", "marketing"],
        "moderator": "product_manager",
        "max_rounds": {"lite": 1, "standard": 2, "full": 2},
        "output": "竞品分析报告"
      }
    },
    {
      "id": "act_concept_3",
      "name": "合规预评估",
      "description": "识别所有适用认证/法规要求，预估周期和费用",
      "visibility": {"show_in_tiers": ["full"], "can_be_skipped": true},
      "agent_rounds": {
        "type": "parallel",
        "agents": ["rd", "product_manager"],
        "moderator": "rd",
        "max_rounds": 2,
        "output": "合规预评估报告"
      }
    },
    {
      "id": "act_concept_4",
      "name": "初步技术可行性评估",
      "description": "评估核心技术风险、关键物料可用性",
      "visibility": {"show_in_tiers": ["standard", "full"], "can_be_skipped": true},
      "agent_rounds": {
        "type": "parallel",
        "agents": ["rd", "manufacturing"],
        "moderator": "rd",
        "max_rounds": {"standard": 1, "full": 2},
        "output": "技术可行性初步评估"
      }
    },
    {
      "id": "act_concept_5",
      "name": "商业论证",
      "description": "市场规模、定价策略、ROI 预测、现金流时间轴",
      "visibility": {"show_in_tiers": ["lite", "standard", "full"], "can_be_skipped": false},
      "agent_rounds": {
        "type": "sequential",
        "agents": ["finance", "marketing"],
        "moderator": "finance",
        "max_rounds": {"lite": 1, "standard": 2, "full": 3},
        "output": "初步商业计划书"
      }
    },
    {
      "id": "act_concept_6",
      "name": "MRD 撰写",
      "description": "汇总所有分析，生成市场需求文档",
      "visibility": {"show_in_tiers": ["lite", "standard", "full"], "can_be_skipped": false},
      "agent_rounds": {
        "type": "sequential",
        "agents": ["product_manager", "marketing", "rd", "finance"],
        "moderator": "product_manager",
        "max_rounds": {"lite": 1, "standard": 1, "full": 1},
        "output": "MRD"
      }
    }
  ]
}
```

---

## 十、开发阶段并行分支简化

开发阶段的 3 个并行分支（hw/sw/mech）在用户界面上不再是 3 条独立的"轨道"，而是：

```
主活动流（所有分支共享）          侧边栏
─────────────────────          ────────────
1. 详细设计                     🟢 供应链状态
2. TR3 详细设计评审              🟢 认证进度 (full)
3. 开发与单元测试                🟢 预算健康度
   ├─ 硬件开发 [子任务]
   ├─ 软件开发 [子任务]
   └─ 结构开发 [子任务]
4. TR4 原型评审
5. DFM 审查
6. 测试用例编写
```

```json
{
  "parallel_groups": [
    {
      "group_id": "hw",
      "label": "硬件开发",
      "ui_display": "collapsed_subtask",
      "subtask_of": "act_dev_3"
    },
    {
      "group_id": "sw",
      "label": "软件开发",
      "ui_display": "collapsed_subtask",
      "subtask_of": "act_dev_3"
    },
    {
      "group_id": "mech",
      "label": "结构开发",
      "ui_display": "collapsed_subtask",
      "subtask_of": "act_dev_3"
    }
  ]
}
```

`ui_display: "collapsed_subtask"` 告诉前端：默认折叠显示为一个活动"开发与单元测试"，点击展开才看到三个子分支。不再展开成三路并行轨道。

---

## 十一、主活动流总览（v3）

### 概念阶段

| # | 活动 | lite | standard | full | 可跳过 | 需人工 |
|---|------|------|----------|------|--------|--------|
| 1 | 客户需求调研 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | 竞品分析 | ❌ | ✅ | ✅ | ✅ | - |
| 3 | 合规预评估 | ❌ | ❌ | ✅ | ✅ | - |
| 4 | 初步技术可行性评估 | ❌ | ✅ | ✅ | ✅ | - |
| 5 | 商业论证 | ✅ | ✅ | ✅ | - | - |
| 6 | MRD 撰写 | ✅ | ✅ | ✅ | - | - |

### 计划阶段

| # | 活动 | lite | standard | full | 可跳过 | 需人工 |
|---|------|------|----------|------|--------|--------|
| 1 | 需求分解与 PRD 撰写 | ✅ | ✅ | ✅ | - | - |
| 2 | 合规计划制定 | ❌ | ✅ | ✅ | ✅ | - |
| 3 | TR1 需求评审 | ✅ | ✅ | ✅ | - | - |
| 4 | 系统架构设计 | ✅ | ✅ | ✅ | - | - |
| 5 | TR2 设计评审 | ✅ | ✅ | ✅ | - | - |
| 6 | BOM 与成本估算 | ✅ | ✅ | ✅ | - | - |
| 7 | 供应链初步评估 | ❌ | ✅ | ✅ | ✅ | - |
| 8 | 风险评估 | ❌ | ✅ | ✅ | - | - |
| 9 | PDCP 材料准备 | ✅ | ✅ | ✅ | - | - |

### 开发阶段

| # | 活动 | lite | standard | full | 可跳过 | 需人工 |
|---|------|------|----------|------|--------|--------|
| 1 | 详细设计 | ✅ | ✅ | ✅ | - | - |
| 2 | TR3 详细设计评审 | ✅ | ✅ | ✅ | - | - |
| 3 | 开发与单元测试 [含 hw/sw/mech 子任务] | ✅ | ✅ | ✅ | - | - |
| 4 | BOM 实际成本更新 | ❌ | ✅ | ✅ | - | - |
| 5 | DFM 审查 | ❌ | ✅ | ✅ | - | - |
| 6 | 认证样机准备 | ❌ | ❌ | ✅ | ✅ | - |
| 7 | TR4 原型评审 | ✅ | ✅ | ✅ | - | - |
| 8 | 测试用例编写 | ✅ | ✅ | ✅ | - | - |

### 验证阶段

| # | 活动 | lite | standard | full | 可跳过 | 需人工 |
|---|------|------|----------|------|--------|--------|
| 1 | 系统测试 | ✅ | ✅ | ✅ | - | - |
| 2 | TR5 测试结果评审 | ✅ | ✅ | ✅ | - | - |
| 3 | Beta 测试 + 客户反馈 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 4 | TR6 生产就绪评审 | ✅ | ✅ | ✅ | - | - |
| 5 | ADCP 材料准备 | ✅ | ✅ | ✅ | - | - |

### 发布阶段

| # | 活动 | lite | standard | full | 可跳过 | 需人工 |
|---|------|------|----------|------|--------|--------|
| 1 | GTM 计划制定与执行 | ✅ | ✅ | ✅ | - | - |
| 2 | 生产准备与首批量产 | ✅ | ✅ | ✅ | - | - |
| 3 | 上市公告 | ✅ | ✅ | ✅ | ✅ | - |

### 生命周期阶段

| # | 活动 | lite | standard | full | 可跳过 | 需人工 |
|---|------|------|----------|------|--------|--------|
| 1 | 定期运营评审 | ✅ | ✅ | ✅ | - | - |
| 2 | LDCP 生命周期决策 | ✅ | ✅ | ✅ | - | - |
| 3 | 迭代需求收集 | ✅ | ✅ | ✅ | ✅ | - |

**活动数对比：**

| 模式 | 概念 | 计划 | 开发 | 验证 | 发布 | 生命周期 | 总计 |
|------|------|------|------|------|------|---------|------|
| lite | 3 | 6 | 5 | 4 | 3 | 3 | **24** |
| standard | 5 | 8 | 7 | 5 | 3 | 3 | **31** |
| full | 6 | 9 | 8 | 5 | 3 | 3 | **34** |

加上后台任务 1 个 + 侧边栏小组件 1-4 个，用户实际感知的活动量大幅下降。

---

## 十二、角色定义

同 v2，无变更。

---

## 十三、产出物清单（v3）

同 v2 的 26 个产出物，无增减。`budget_tracker`、`cash_flow_timeline`、`supply_chain_status`、`competitor_monitor` 改为后台/侧边栏自动更新。

---

## 十四、默认配置

```json
{
  "max_parallel_agents": 6,
  "default_round_timeout_seconds": 300,
  "gate_default_timeout_hours": 72,
  "escalation_default_hours": 48,
  "max_rollback_count": 2,
  "budget_warning_threshold_percent": 80,
  "budget_deviation_alert_percent": 15,
  "auto_advance_stage": false,
  "require_human_signoff_for_gates": true,
  "allow_advance_with_advisory_open": true,
  "max_advisory_open": 5,
  "cost_tracking_enabled": true,
  "audit_log_enabled": true,
  "default_complexity": "auto",
  "min_human_interactions_per_stage": 1,
  "auto_pass_max_count": 3,
  "single_user_mode": false,
  "portfolio_priority": "P1",
  "portfolio_priority_options": ["P0", "P1", "P2"],
  "resource_conflict_detection": {
    "enabled": true,
    "conflict_roles": ["rd", "qa", "manufacturing"],
    "alert_on_same_stage_overlap": true
  },
  "model_fallback": {
    "enabled": true,
    "max_retries": 3,
    "fallback_chain": ["claude-sonnet-4-5", "gpt-4o", "claude-haiku-4-5"]
  },
  "notifications": {
    "on_gate_ready": true,
    "on_stage_complete": true,
    "on_review_required": true,
    "on_budget_deviation": true,
    "on_blocking_detected": true,
    "on_widget_status_change": true,
    "on_resource_conflict": true,
    "digest_frequency_hours": 24
  }
}
```

### 新增配置字段说明（v3）

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `min_human_interactions_per_stage` | 1 | 每阶段最少人类操作次数。低于此值不允许推进。防止 Agent 全自动跑完流程 |
| `auto_pass_max_count` | 3 | `auto_pass_until_anomaly` 的最大自动通过次数。超过后强制弹窗要求人类确认 |
| `single_user_mode` | false | 单人模式。为 true 时所有门禁投票自动通过，Agent 产出直接标记"自动完成" |

### UI 概念分离说明（v3）

> **审查发现**：`sidebar_widgets` 和 `parallel_groups` 中混入了 UI 展示概念（`icon`、`ui_display`、`expandable_detail`、`status_levels` 的颜色）。这些是前端渲染规则，不应与业务流程定义耦合。v3 标记这些字段为"前端渲染提示"，引擎不解析它们——引擎只负责推送数据，前端负责如何展示。

| 字段类别 | 谁负责 | 示例 |
|---------|--------|------|
| 流程逻辑 | 引擎解析 | `visible_in_stages`, `trigger`, `executor` |
| 渲染提示 | 前端解析 | `icon`, `ui_display`, `status_levels`, `expandable_detail` |

---

## 十五、v1 → v2 → v3 演变总结

| 维度 | v1 | v2 | v3 |
|------|-----|-----|-----|
| 活动数 | 29 | 44 | 24(lite) / 31(std) / 34(full) |
| 财务追踪 | 无 | 每阶段一个核算活动 | 后台自动 + 侧边栏预算小组件 |
| 供应链 | 只查一次 | 每两周弹窗 | 侧边栏状态灯，异常才提醒 |
| 认证 | 一句话 | 4 个阶段活动 | full 模式 3 个活动 + 侧边栏认证进度 |
| 人工输入 | 无 | 4 个阻塞式弹窗 | 3 种放行方式，不卡流程 |
| 复杂度分级 | 无 | 无 | lite/standard/full 自动裁剪 |
| 并行分支 | 三路轨道 | 三路轨道 | 折叠子任务，默认不展开 |
| Exit criteria | 5-7 条平铺 | 8-10 条平铺 | 3-4 阻断 + 其余关注级 |
| 门禁失败 | block/redirect/skip | +conditional_pass +remediation | 同 v2 |
| 项目组合 | 无 | portfolio_priority | 同 v2 |
| 竞品 | 概念阶段一次 | +生命周期每月 | 同 v2，但改为侧边栏 |

---

## 十六、与引擎的对接约定

1. **模板加载**：`WorkflowEngine.load_template("standard_ipd_v3")` 读取 JSON
2. **复杂度判定**：引擎根据项目属性自动推荐复杂度，用户可覆盖
3. **活动裁剪**：引擎根据 `visibility.show_in_tiers` 过滤活动列表
4. **后台任务**：阶段完成事件触发 `background_jobs`，静默执行
5. **侧边栏小组件**：引擎推送 widget 状态到前端 WebSocket
6. **人工输入放行**：前端渲染 bypass_options，用户选择后继续流程
7. **Exit criteria 分级**：阻断级全部通过才允许推进，关注级不阻塞
8. **跨项目资源检测**：同 v2

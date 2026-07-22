# 自定义模板系统 — 设计方案 v1

> **目标**：让用户创建自己的业务逻辑模板（与 IPD 同级），在创建项目时可选择使用。
> **实现策略**：前端效果优先，后端接口预留。比赛展示用前端模拟数据即可。

---

## 一、设计目标

| 目标 | 说明 |
|------|------|
| 模板与 IPD 同级 | 用户自定义模板和内置 IPD 模板在同一个选择器中展示 |
| 快速入口 | Dashboard 增加"新建模板"入口，引导用户创建自己的模板 |
| 创建项目时选择 | 项目创建页的模板下拉框同时展示内置模板和用户自定义模板 |
| 前端效果优先 | 模板编辑器、模板列表等页面先做 UI 效果，标注"功能开发中" |
| 数据结构预留 | 后端 models 和数据库表预留，前端 types 定义完整 |

---

## 二、用户流程

```
Dashboard 快速入口
  ├── 创建新项目 → 项目创建页 → 选择模板（内置 + 自定义）
  └── 新建模板   → 模板编辑器（前端占位页）

项目创建页
  └── 选择模板下拉框
        ├── 内置模板
        │     ├── 硬件 IPD（standard_ipd_v3）
        │     ├── 软件 IPD（software_ipd）
        │     └── 医疗器械 IPD（medical_ipd）
        └── 我的模板（用户自定义）
              ├── 敏捷开发模板
              ├── 内容创作流程
              └── ...（用户创建的模板）
```

---

## 三、模板数据结构

### 3.1 前端类型定义

```typescript
// shared/types.ts 新增

/** 模板来源 */
type TemplateSource = 'builtin' | 'custom';

/** 模板分类 */
type TemplateCategory = 'product_rd' | 'software' | 'medical' | 'marketing' | 'content' | 'custom';

/** 模板摘要（列表展示用） */
interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  source: TemplateSource;          // builtin | custom
  stageCount: number;
  activityCount: number;
  icon: string;                    // emoji 或图标名
  createdAt: string;
  isBuiltin: boolean;              // 是否内置（不可删除）
}

/** 模板详情（编辑器用） */
interface TemplateDetail {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  source: TemplateSource;
  stages: TemplateStage[];         // 阶段列表
  gates: TemplateGate[];           // 门禁列表
  roles: TemplateRole[];           // Agent 角色
  activities: TemplateActivity[];  // 活动列表
  artifacts: TemplateArtifact[];   // 产出物定义
  createdAt: string;
  updatedAt: string;
}

interface TemplateStage {
  id: string;
  name: string;
  order: number;
  description: string;
  color: string;                   // 阶段颜色标识
}

interface TemplateGate {
  id: string;
  name: string;
  stageId: string;                 // 所属阶段
  description: string;
  requiredRoles: string[];         // 需要哪些角色投票
}

interface TemplateRole {
  id: string;
  name: string;
  label: string;                   // 中文名
  responsibilities: string[];
}

interface TemplateActivity {
  id: string;
  name: string;
  stageId: string;
  assignedRole: string;            // 负责的 Agent 角色
  description: string;
  artifactType: string;            // 产出的产出物类型
}
```

### 3.2 后端数据模型（预留）

```python
# backend/m2_workflow_engine/models.py 新增

class TemplateCreateRequest(BaseModel):
    """创建模板请求（预留）。"""
    name: str = Field(..., min_length=2, max_length=50)
    description: str = Field(default="")
    category: str = Field(default="custom")
    stages: list[dict] = Field(default_factory=list)
    gates: list[dict] = Field(default_factory=list)
    roles: list[dict] = Field(default_factory=list)
    activities: list[dict] = Field(default_factory=list)

class TemplateResponse(BaseModel):
    """模板响应（预留）。"""
    id: str
    name: str
    description: str
    category: str
    source: str  # "builtin" | "custom"
    stage_count: int
    activity_count: int
    created_at: str
    updated_at: str
```

### 3.3 数据库表（预留）

```sql
-- 模板表（预留，MVP 阶段不创建，前端用模拟数据）
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'custom',
    source TEXT DEFAULT 'custom',  -- 'builtin' | 'custom'
    config_json TEXT DEFAULT '{}', -- 完整模板配置 JSON
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 四、前端页面设计

### 4.1 Dashboard 快速入口 — 新增"新建模板"

**文件**：`frontend/src/m12_dashboard/components/QuickActions.tsx`

在现有两个入口（创建新项目、审核仪表盘）基础上，新增第三个：

```
┌──────────────────────────────┐
│  快速入口                     │
│                              │
│  ┌────────────────────────┐  │
│  │ 🔵 创建新项目           │  │
│  │    快速启动业务流程      │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🟣 审核仪表盘           │  │
│  │    查看所有待审核事项    │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🟢 新建模板     ← 新增  │  │
│  │    创建自定义业务流程    │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

- 图标：`FileAddOutlined` 或 `AppstoreAddOutlined`
- 渐变色：绿色系 `linear-gradient(135deg, #00ff9d 0%, #10b981 100%)`
- 点击跳转：`/templates/new`

### 4.2 项目创建页 — 模板选择器增强

**文件**：`frontend/src/m13_project_creation/components/QuickStartForm.tsx`

当前已有 `TEMPLATE_OPTIONS` 下拉框，需要增强：

```typescript
// 改造前（硬编码）
const TEMPLATE_OPTIONS = [
  { value: 'standard_ipd_v3', label: '硬件IPD' },
  { value: 'software_ipd', label: '软件IPD' },
  { value: 'medical_ipd', label: '医疗器械IPD' },
  { value: 'custom', label: '自定义' },
];

// 改造后（分组 + 动态加载）
// 使用 <optgroup> 分组展示内置模板和用户自定义模板
```

下拉框效果：

```
┌─────────────────────────────────┐
│ 选择模板                    ▼   │
├─────────────────────────────────┤
│ ── 内置模板 ──                  │
│   硬件 IPD                      │
│   软件 IPD                      │
│   医疗器械 IPD                  │
│ ── 我的模板 ──                  │
│   敏捷开发流程                  │
│   内容创作 SOP                  │
│   客户交付流程                  │
│ ──────────────                  │
│ + 新建模板...                   │
└─────────────────────────────────┘
```

### 4.3 模板编辑器页（占位页）

**新文件**：`frontend/src/m20_template_editor/index.tsx`

路由：`/templates/new` 和 `/templates/:templateId/edit`

页面结构（前端效果，标注"功能开发中"）：

```
┌──────────────────────────────────────────────┐
│  ← 返回    新建模板                          │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  ⚠ 模板编辑器功能开发中，敬请期待     │    │
│  │                                      │    │
│  │  您可以先使用内置的 IPD 模板创建项目   │    │
│  │                                      │    │
│  │  [返回首页]  [使用 IPD 模板]          │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌─ 模板信息 ──────────────────────────┐    │
│  │  模板名称: [________________]        │    │
│  │  模板描述: [________________]        │    │
│  │  分类:     [下拉选择器（禁用）]       │    │
│  │                                      │    │
│  │  ┌─ 阶段配置 ──────────────────┐    │    │
│  │  │  + 添加阶段（禁用）          │    │    │
│  │  │  暂无阶段配置                │    │    │
│  │  └────────────────────────────┘    │    │
│  │                                      │    │
│  │  ┌─ Agent 角色 ────────────────┐    │    │
│  │  │  + 添加角色（禁用）          │    │    │
│  │  │  暂无角色配置                │    │    │
│  │  └────────────────────────────┘    │    │
│  │                                      │    │
│  │  [保存模板]（禁用）                   │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

### 4.4 模板列表页（占位页）

**新文件**：`frontend/src/m20_template_editor/TemplateList.tsx`

路由：`/templates`

展示用户已创建的模板列表（前端模拟数据）：

```
┌──────────────────────────────────────────────┐
│  我的模板                        + 新建模板   │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ 📋 敏捷开发流程                       │    │
│  │    适用于互联网产品快速迭代            │    │
│  │    5 阶段 · 18 活动 · 4 角色          │    │
│  │                           [编辑] [删除]│    │
│  └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────┐    │
│  │ 📝 内容创作 SOP                       │    │
│  │    适用于自媒体内容团队               │    │
│  │    4 阶段 · 12 活动 · 3 角色          │    │
│  │                           [编辑] [删除]│    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  💡 提示                             │    │
│  │  模板功能开发中，以上为效果预览       │    │
│  │  当前请使用内置 IPD 模板创建项目      │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

---

## 五、路由设计

```typescript
// App.tsx 新增路由

{
  path: '/templates',
  element: <TemplateListPage />,        // 模板列表
},
{
  path: '/templates/new',
  element: <TemplateEditorPage />,      // 新建模板（占位）
},
{
  path: '/templates/:templateId/edit',
  element: <TemplateEditorPage />,      // 编辑模板（占位）
},
```

---

## 六、实现步骤

### 第一步：设计文档（当前步骤）
- [x] 编写 `docx/template-system-design.md`

### 第二步：前端类型定义
- 在 `shared/types.ts` 新增 `TemplateSummary`、`TemplateDetail` 等类型
- 在 `m13_project_creation/types.ts` 扩展 `ProjectFormData`（如需要）

### 第三步：Dashboard 快速入口
- 修改 `QuickActions.tsx`，新增"新建模板"入口
- 跳转至 `/templates/new`

### 第四步：项目创建页模板选择器
- 修改 `QuickStartForm.tsx`，将模板下拉框改为分组展示
- 内置模板 + 用户自定义模板（模拟数据）
- 底部增加"+ 新建模板..."选项

### 第五步：模板编辑器占位页
- 创建 `m20_template_editor/` 模块
- 实现占位 UI（标注"功能开发中"）
- 包含禁用的表单控件展示效果

### 第六步：模板列表占位页
- 创建 `TemplateList.tsx`
- 展示模拟的模板卡片数据
- 标注"功能开发中"提示

### 第七步：后端预留
- 在 `models.py` 添加 `TemplateCreateRequest`、`TemplateResponse`
- 在数据库迁移中预留 `templates` 表（可选，MVP 阶段可跳过）

---

## 七、模拟数据

```typescript
// 用于前端展示的模拟模板数据
const MOCK_CUSTOM_TEMPLATES: TemplateSummary[] = [
  {
    id: 'tpl_agile_v1',
    name: '敏捷开发流程',
    description: '适用于互联网产品快速迭代，双周 Sprint 节奏',
    category: 'software',
    source: 'custom',
    stageCount: 5,
    activityCount: 18,
    icon: '📋',
    createdAt: '2026-07-15',
    isBuiltin: false,
  },
  {
    id: 'tpl_content_v1',
    name: '内容创作 SOP',
    description: '适用于自媒体内容团队，从选题到发布全流程',
    category: 'content',
    source: 'custom',
    stageCount: 4,
    activityCount: 12,
    icon: '📝',
    createdAt: '2026-07-10',
    isBuiltin: false,
  },
  {
    id: 'tpl_delivery_v1',
    name: '客户交付流程',
    description: '适用于 B2B 项目交付，需求确认到验收上线',
    category: 'custom',
    source: 'custom',
    stageCount: 6,
    activityCount: 22,
    icon: '🚀',
    createdAt: '2026-06-28',
    isBuiltin: false,
  },
];
```

---

## 八、文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `docx/template-system-design.md` | 新建 | 本设计文档 |
| `frontend/src/shared/types.ts` | 修改 | 新增模板相关类型 |
| `frontend/src/m12_dashboard/components/QuickActions.tsx` | 修改 | 新增"新建模板"入口 |
| `frontend/src/m13_project_creation/components/QuickStartForm.tsx` | 修改 | 模板选择器分组展示 |
| `frontend/src/m20_template_editor/index.tsx` | 新建 | 模板编辑器占位页 |
| `frontend/src/m20_template_editor/TemplateList.tsx` | 新建 | 模板列表占位页 |
| `frontend/src/App.tsx` | 修改 | 新增路由 |
| `backend/m2_workflow_engine/models.py` | 修改 | 预留模板请求/响应模型 |

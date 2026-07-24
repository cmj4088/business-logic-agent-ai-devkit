# M5: 产出物管理 — CLAUDE.md

> **模块编号**：M5
> **模块名称**：产出物管理
> **负责 Agent**：全栈开发 C
> **开发周期**：Week 3-5
> **上游依赖**：M0（基础设施）、M1（认证安全）、M4（Agent 编排）
> **下游被依赖**：M6（审核系统）、M14a（项目骨架）、M16（产出物编辑）

---

## 职责范围

M5 负责 IPD 流程中所有产出物（文档）的管理：
1. **产出物 CRUD**：创建、读取、更新、删除 IPD 产出物
2. **版本管理**：每次修改创建新版本，旧版本保留
3. **类型管理**：18 种产出物类型（lite 模式）的定义和校验
4. **Markdown 渲染**：产出物内容以 Markdown 存储，支持渲染
5. **附件管理**：产出物可附带文件（上传/下载/删除）
6. **AIBadge 数据**：产出物的 AI 生成标识和可信度数据
7. **自动生成**：Agent 编排完成后自动创建/更新对应产出物

---

## 输入依赖

| 依赖 | 来源 | 用途 |
|------|------|------|
| FastAPI app 实例 | M0 | 注册路由 |
| 数据库会话 | M0 | 产出物 CRUD |
| 认证中间件 | M1 | 用户身份 |
| Agent 编排 | M4 | 接收 Agent 生成的产出物内容 |

---

## 输出接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/artifacts` | GET | 项目产出物列表（可按类型/阶段筛选） |
| `/api/artifacts/{id}` | GET | 产出物详情 |
| `/api/artifacts/{id}/versions` | GET | 产出物版本历史 |
| `/api/artifacts/{id}/versions/{version}` | GET | 特定版本内容 |
| `/api/artifacts/{id}` | PUT | 更新产出物（创建新版本） |
| `/api/artifacts/{id}/attachments` | POST | 上传附件 |
| `/api/artifacts/{id}/attachments/{file_id}` | GET/DELETE | 下载/删除附件 |
| `/api/artifacts/types` | GET | 产出物类型列表 |

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `router.py` | 产出物路由 |
| `artifact_service.py` | 产出物业务逻辑 |
| `version_service.py` | 版本管理 |
| `attachment_service.py` | 附件上传/下载 |
| `artifact_types.py` | 18 种产出物类型定义 |
| `markdown_renderer.py` | Markdown 转 HTML 渲染 |
| `models.py` | Pydantic 模型 |

---

## 18 种产出物类型（lite 模式）

| 阶段 | 产出物 |
|------|--------|
| 概念 | 客户需求摘要、初步商业计划书、MRD |
| 计划 | PRD、系统架构设计文档、BOM与成本估算、风险评估报告、PDCP材料 |
| 开发 | 详细设计文档、单元测试报告、TR4评审报告、测试用例集 |
| 验证 | 系统测试报告、TR5/TR6评审报告、ADCP材料 |
| 发布 | GTM执行计划、首批生产报告 |
| 生命周期 | 运营评审报告、迭代需求清单 |

---

## 版本管理规则

1. 每次 PUT 更新创建新版本（version 自增）
2. 旧版本只读，不可修改
3. 版本号格式：`v{version_number}`
4. 同一产出物的 `(project_id, artifact_type, name, version)` 唯一
5. 用户可对比任意两个版本

---

## AIBadge 数据

每个产出物记录以下 AI 标识信息：
```json
{
  "ai_generated": true,
  "generated_by": ["product_manager", "marketing"],
  "generation_mode": "sequential",
  "confidence_level": "green",  // green / yellow / red
  "verified_facts": 3,
  "speculations": 1
}
```

---

## 数据库表

- `artifacts`：产出物表（id, project_id, artifact_type, name, content, ai_metadata, ...）
- `artifact_versions`：版本表（id, artifact_id, version, content, created_at）
- `attachments`：附件表（id, artifact_id, filename, file_path, mime_type, size）

---

## 技能集成

### 可调用的 Skill
M5 是产出物管理的核心模块，需要集成全部 3 个 Skill：

| Skill | 用途 | 产出物类型 |
|-------|------|-----------|
| **`ipd-data-analysis`** | 生成分析数据/报告 | 市场分析报告、质量分析报告、用量统计报告 |
| **`ipd-xlsx`** | 生成 Excel 格式交付物 | BOM 成本表、财务预算表、项目进度表、竞品对比矩阵 |
| **`ipd-docx`** | 生成 Word 格式文档 | MRD、PRD、技术方案、测试报告、商业论证 |

### 产出物类型与 Skill 映射

| 阶段 | 产出物 | 格式 | 使用的 Skill |
|------|--------|------|-------------|
| 概念 | 客户需求摘要 | Markdown | 无 |
| 概念 | 初步商业计划书 | Markdown | 无 |
| 概念 | MRD | **Word (.docx)** | `ipd-docx` |
| 计划 | PRD | **Word (.docx)** | `ipd-docx` |
| 计划 | 系统架构设计文档 | **Word (.docx)** | `ipd-docx` |
| 计划 | BOM 与成本估算 | **Excel (.xlsx)** | `ipd-xlsx` |
| 计划 | 风险评估报告 | Markdown | 无 |
| 计划 | PDCP 材料 | **Word (.docx)** + **Excel (.xlsx)** | `ipd-docx` + `ipd-xlsx` |
| 开发 | 详细设计文档 | **Word (.docx)** | `ipd-docx` |
| 开发 | 单元测试报告 | **Excel (.xlsx)** | `ipd-xlsx` |
| 开发 | TR4 评审报告 | **Word (.docx)** | `ipd-docx` |
| 开发 | 测试用例集 | **Excel (.xlsx)** | `ipd-xlsx` |
| 验证 | 系统测试报告 | **Word (.docx)** | `ipd-docx` |
| 验证 | TR5/TR6 评审报告 | **Word (.docx)** | `ipd-docx` |
| 验证 | ADCP 材料 | **Word (.docx)** | `ipd-docx` |
| 发布 | GTM 执行计划 | **Word (.docx)** | `ipd-docx` |
| 发布 | 首批生产报告 | **Excel (.xlsx)** | `ipd-xlsx` |
| 生命周期 | 运营评审报告 | **Word (.docx)** | `ipd-docx` |
| 生命周期 | 迭代需求清单 | Markdown | 无 |

### 生成流程
```
1. M4 编排完成后，向 M5 发送产出物生成请求
2. M5 判断产出物类型：
   - 若为 Excel/Word 格式 → 调用对应 Skill 生成文件
   - 若为 Markdown 格式 → 直接存储文本内容
3. 将生成的文件存储为附件，关联到产出物记录
4. 记录 AIBadge 数据（AI 生成标识、可信度）
5. 创建版本记录（v1）
```

---

## 完成标准

- [ ] 18 种产出物类型定义完整
- [ ] 产出物 CRUD 全部可用
- [ ] 版本管理正确（更新创建新版本，旧版本保留可读）
- [ ] 附件上传/下载/删除可用
- [ ] AIBadge 数据正确记录
- [ ] Markdown 内容正确存储和渲染
- [ ] Agent 编排完成后自动创建/更新对应产出物
- [ ] Excel 格式产出物通过 `ipd-xlsx` Skill 自动生成
- [ ] Word 格式产出物通过 `ipd-docx` Skill 自动生成
- [ ] 分析类产出物通过 `ipd-data-analysis` Skill 生成数据

---

## 禁止事项

1. **禁止直接修改已有版本**（必须创建新版本）
2. **禁止删除有版本历史的产出物**（软删除，设置 deleted_at）
3. **禁止附件上传无大小限制**（最大 50MB）
4. **禁止附件上传无类型校验**（校验 magic bytes，不是扩展名）
5. **禁止产出物内容中保留原始敏感数据**（存储前应已过滤）
6. **禁止产出物类型硬编码在路由中**（从 artifact_types.py 读取）

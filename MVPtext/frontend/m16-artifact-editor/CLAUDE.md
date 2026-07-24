# M16: 产出物编辑 — CLAUDE.md

> **模块编号**：M16
> **模块名称**：产出物查看/编辑（前端）
> **负责 Agent**：前端开发 E
> **开发周期**：Week 6-7
> **上游依赖**：M5（产出物管理后端）、M10（异常恢复）
> **下游被依赖**：无（独立页面）

---

## 职责范围

M16 负责产出物的查看和编辑页面：
1. **产出物列表**：项目的所有产出物（按阶段/类型分组）
2. **产出物查看**：Markdown 渲染显示产出物内容
3. **产出物编辑**：Markdown 编辑器（支持预览）
4. **版本对比**：并排对比两个版本（diff 视图）
5. **版本历史**：产出物的所有历史版本
6. **附件管理**：附件上传/下载/删除
7. **AIBadge 显示**：产出物的 AI 生成标识和可信度信息
8. **重新生成**：调用 M10 异常恢复重新生成产出物

---

## 输入依赖

| 依赖 | 来源 | 用途 |
|------|------|------|
| API 客户端 | shared/api-client.ts | 产出物 CRUD API |
| AuthContext | M11 | 用户信息 |
| 类型定义 | shared/types.ts | 产出物类型 |
| 后端 M10 | 异常恢复（`POST /api/recovery/regenerate/{artifact_id}`） | 重新生成产出物 |

---

## 输出接口

| 输出 | 类型 | 说明 |
|------|------|------|
| `/projects/:id/artifacts` | Route | 产出物列表页 |
| `/projects/:id/artifacts/:artifactId` | Route | 产出物详情/编辑页 |

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `index.tsx` | 产出物模块入口（路由配置） |
| `components/ArtifactList.tsx` | 产出物列表（按阶段分组） |
| `components/ArtifactViewer.tsx` | 产出物查看器（Markdown 渲染） |
| `components/ArtifactEditor.tsx` | 产出物编辑器（Markdown 编辑 + 预览） |
| `components/VersionHistory.tsx` | 版本历史列表 |
| `components/VersionDiff.tsx` | 版本对比视图（并排 diff） |
| `components/AttachmentManager.tsx` | 附件管理（上传/下载/删除） |
| `components/AIBadge.tsx` | AI 生成标识 |
| `components/RegenerateButton.tsx` | 重新生成按钮 |
| `hooks/useArtifacts.ts` | 产出物数据 Hook |
| `hooks/useVersionDiff.ts` | 版本对比 Hook |
| `api.ts` | 产出物 API 调用 |
| `types.ts` | 产出物相关类型 |

---

## 页面布局

### 产出物列表
```
┌──────────────────────────────────────────────────────────┐
│ 📄 产出物 — 智能音箱                                       │
│                                                          │
│ 概念阶段                                                  │
│ ├── 📝 客户需求摘要          v1  🤖  7/1   [查看]         │
│ ├── 📝 初步商业计划书         v2  🤖  7/2   [查看]         │
│ └── 📝 MRD                   v1  🤖  7/3   [查看] [编辑]  │
│                                                          │
│ 计划阶段                                                  │
│ └── ⬜ 暂无产出物                                         │
│                                                          │
│ ...（其他阶段折叠）                                        │
└──────────────────────────────────────────────────────────┘
```

### 版本对比视图
```
┌──────────────────────────────────────────────────────────┐
│ ← 返回     MRD — 版本对比                                 │
│                                                          │
│ ┌─────────────────────┐  ┌─────────────────────────────┐ │
│ │ v1 (7/1)            │  │ v2 (7/3) — 当前版本          │ │
│ │                     │  │                              │ │
│ │ 目标市场: 全球TWS... │  │ 目标市场: 全球TWS市场预计...   │ │
│ │ 竞品: Apple 30%...  │  │ 竞品: Apple AirPods占31%... │ │
│ │ 定价: $129-179      │  │ 定价: $149-199              │ │
│ │                     │  │ + 新增: 用户画像分析          │ │
│ └─────────────────────┘  └─────────────────────────────┘ │
│                                                          │
│ [恢复到 v1]                                               │
└──────────────────────────────────────────────────────────┘
```

---

## Markdown 编辑器

- 使用轻量级 Markdown 编辑器（如 Milkdown 或 Toast UI Editor）
- 支持：标题、列表、粗体、斜体、表格、链接、图片
- 实时预览（分屏模式）
- 保存时创建新版本

---

## 技能集成

### 技能生成产出物的预览与展示

M16 需要支持预览由 3 个 Skill 生成的不同格式产出物：

| 产出物类型 | 生成 Skill | 格式 | 前端展示方式 |
|-----------|-----------|------|------------|
| MRD（市场需求文档） | `ipd-docx` | Word (.docx) | ① 使用 `docx` 库解析为 HTML 预览<br>② 提供下载原始 .docx 文件<br>③ 显示 AIBadge + 可信度 |
| PRD（产品需求文档） | `ipd-docx` | Word (.docx) | 同上 |
| 技术方案文档 | `ipd-docx` | Word (.docx) | 同上 |
| 测试报告 | `ipd-docx` | Word (.docx) | 同上 |
| 商业论证文档 | `ipd-docx` | Word (.docx) | 同上 |
| BOM 成本表 | `ipd-xlsx` | Excel (.xlsx) | ① 使用 `xlsx` 库解析为表格预览<br>② 显示公式计算结果<br>③ 提供下载原始 .xlsx 文件 |
| 财务预算表 | `ipd-xlsx` | Excel (.xlsx) | 同上（含预算 vs 实际对比、超预算标红） |
| 项目进度表 | `ipd-xlsx` | Excel (.xlsx) | 同上（含甘特图格式） |
| 竞品对比矩阵 | `ipd-xlsx` | Excel (.xlsx) | 同上（含雷达图数据） |
| 市场分析报告 | `ipd-data-analysis` | Markdown | ① Markdown 渲染预览<br>② 图表以图片形式嵌入<br>③ 数据表格可排序 |
| 质量分析报告 | `ipd-data-analysis` | Markdown | 同上 |
| 用量统计报告 | `ipd-data-analysis` | Markdown | 同上 |

### 预览组件架构

```typescript
// 产出物预览路由组件
function ArtifactPreview({ artifact }: { artifact: Artifact }) {
  switch (artifact.fileType) {
    case 'docx':
      return <DocxPreview url={artifact.downloadUrl} />;
    case 'xlsx':
      return <XlsxPreview url={artifact.downloadUrl} />;
    case 'md':
      return <MarkdownPreview content={artifact.content} />;
    default:
      return <MarkdownPreview content={artifact.content} />;
  }
}
```

### 预览库选型

| 格式 | 推荐库 | 说明 |
|------|-------|------|
| Word (.docx) | `docx-preview` | 纯前端渲染，无需后端转换 |
| Excel (.xlsx) | `xlsx` (SheetJS) | 读取并解析为 HTML 表格 |
| Markdown | `react-markdown` | 配合 `remark-gfm` 支持 GFM 语法 |

## 完成标准

- [ ] 产出物列表按阶段正确分组
- [ ] Markdown 内容正确渲染
- [ ] Markdown 编辑器可用（编辑 + 预览）
- [ ] 版本历史列表完整
- [ ] 版本对比视图正确显示差异
- [ ] 附件上传/下载/删除可用
- [ ] AIBadge 正确显示
- [ ] 重新生成按钮触发正确流程
- [ ] 编辑保存创建新版本
- [ ] **Word 文档（.docx）在线预览正确渲染**
- [ ] **Excel 文件（.xlsx）在线预览正确渲染为表格**
- [ ] **Skill 生成产出物自动显示对应 Skill 标识**
- [ ] **提供 Skill 生成产出物的原始文件下载**

---

## 禁止事项

1. **禁止直接修改已有版本**（编辑必须创建新版本）
2. **禁止版本对比不显示差异高亮**
3. **禁止附件上传无进度条**
4. **禁止附件下载无文件名校验**（防止路径遍历）
5. **禁止 Markdown 编辑器过于复杂**（MVP 只需基础编辑功能）
6. **禁止产出物内容中包含未脱敏的敏感信息**（后端已过滤，前端展示前再做一次检查）

# Agent: 前端开发 E — 任务分配

> **角色**：前端开发 E
> **负责模块**：M14b（项目详情联调）、M15（审核仪表盘）、M16（产出物编辑）
> **开发周期**：Week 5-7
> **技能使用**：展示后端通过 `ipd-data-analysis`、`ipd-xlsx`、`ipd-docx` 生成的数据

---

## 一、M14b — 项目详情联调

### 任务清单
- [ ] 与 M14a 骨架组件联调，填充真实数据
- [ ] 与 M8 WebSocket 联调，接收实时消息和状态更新
- [ ] 与 M10 异常恢复联调，展示 RecoveryPanel
- [ ] 与 M2 工作流引擎联调，实现阶段推进/回退操作
- [ ] 与 M4 Agent 编排联调，展示 Agent 对话实时流
- [ ] 侧边栏面板数据填充（从 M2 widget 接口获取）

### 输入依赖
| 依赖 | 来源 |
|------|------|
| API 客户端 | shared/api-client.ts |
| AuthContext | M11 |
| 类型定义 | shared/types.ts |
| 骨架组件 | M14a |

### 输出接口
| 输出 | 类型 | 说明 |
|------|------|------|
| `/projects/:id` | Route | 项目详情页（联调后） |

### 技能使用
- 前端联调，确保后端 Skill 生成的数据正确展示
- Agent 对话区域展示 Skill 调用进度（skill_start → skill_progress → skill_complete）
- RecoveryPanel 展示 Skill 执行异常的恢复选项

---

## 二、M15 — 审核仪表盘

### 任务清单
- [ ] ReviewList（待审核列表，按项目/阶段/门禁类型分组）
- [ ] ReviewDetail（审核详情，产出物预览 + 门禁检查项）
- [ ] VotePanel（投票面板：通过/驳回/附条件通过）
- [ ] BatchReview（批量审核功能）
- [ ] AutoApprovedBadge（自动通过标识）
- [ ] 审核历史记录
- [ ] 行业合规提示

### 技能集成任务
- [ ] **审核统计图表展示**：
  | 展示区域 | 数据来源 | 对应 Skill | 展示方式 |
  |---------|---------|-----------|---------|
  | 审核通过率统计 | M6 后端聚合数据 | `ipd-data-analysis` | Chart.js 柱状图/折线图 |
  | 遗留问题分布 | M6 后端统计 | `ipd-data-analysis` | 饼图/环形图 + 列表 |
  | 行业合规统计 | M6 后端数据 | `ipd-data-analysis` | 条形图 + 文本摘要 |
  | 审核效率指标 | M6 后端数据 | `ipd-data-analysis` | 数字卡片 + 趋势箭头 |
- [ ] **数据刷新机制**：页面加载时获取 → WebSocket 实时更新 → 投票后自动刷新

### 输入依赖
| 依赖 | 来源 |
|------|------|
| API 客户端 | shared/api-client.ts |
| AuthContext | M11 |
| 类型定义 | shared/types.ts |

### 输出接口
| 输出 | 类型 | 说明 |
|------|------|------|
| `/reviews` | Route | 审核仪表盘页面 |

### 关键文件
| 文件 | 说明 |
|------|------|
| `m15_review_dashboard/components/ReviewList.tsx` | 审核列表 |
| `m15_review_dashboard/components/ReviewDetail.tsx` | 审核详情 |
| `m15_review_dashboard/components/VotePanel.tsx` | 投票面板 |
| `m15_review_dashboard/components/BatchReview.tsx` | 批量审核 |
| `m15_review_dashboard/components/AutoApprovedBadge.tsx` | 自动通过标识 |
| `m15_review_dashboard/hooks/useReviews.ts` | 审核数据 Hook |

---

## 三、M16 — 产出物编辑

### 任务清单
- [ ] ArtifactList（产出物列表，按阶段/类型分组）
- [ ] ArtifactViewer（产出物预览，Markdown 渲染）
- [ ] ArtifactEditor（Markdown 编辑器，支持实时预览）
- [ ] VersionHistory（版本历史列表）
- [ ] VersionDiff（版本对比，并排 diff 视图）
- [ ] AttachmentManager（附件上传/下载/删除）
- [ ] AIBadge 展示（AI 生成标识 + 可信度）
- [ ] RegenerateButton（重新生成按钮，调用 M10 接口）

### 技能集成任务
- [ ] **多格式产出物预览**：
  | 产出物类型 | 格式 | 前端展示方式 |
  |-----------|------|------------|
  | MRD/PRD/技术方案/测试报告/商业论证 | .docx | `docx-preview` 解析为 HTML 预览 + 下载原始文件 |
  | BOM 成本表/财务预算表/项目进度表/竞品矩阵 | .xlsx | `xlsx` (SheetJS) 解析为表格预览 + 下载原始文件 |
  | 市场分析报告/质量分析报告/用量统计报告 | Markdown | `react-markdown` + `remark-gfm` 渲染 |
- [ ] **预览组件架构**：
  ```typescript
  function ArtifactPreview({ artifact }: { artifact: Artifact }) {
    switch (artifact.fileType) {
      case 'docx': return <DocxPreview url={artifact.downloadUrl} />;
      case 'xlsx': return <XlsxPreview url={artifact.downloadUrl} />;
      case 'md':   return <MarkdownPreview content={artifact.content} />;
      default:     return <MarkdownPreview content={artifact.content} />;
    }
  }
  ```

### 输入依赖
| 依赖 | 来源 |
|------|------|
| API 客户端 | shared/api-client.ts |
| AuthContext | M11 |
| 类型定义 | shared/types.ts |
| 后端 M10 | 重新生成接口 |

### 输出接口
| 输出 | 类型 | 说明 |
|------|------|------|
| `/projects/:id/artifacts` | Route | 产出物列表页 |
| `/projects/:id/artifacts/:artifactId` | Route | 产出物详情/编辑页 |

### 关键文件
| 文件 | 说明 |
|------|------|
| `m16_artifact_editor/components/ArtifactList.tsx` | 产出物列表 |
| `m16_artifact_editor/components/ArtifactViewer.tsx` | 产出物查看器 |
| `m16_artifact_editor/components/ArtifactEditor.tsx` | 产出物编辑器 |
| `m16_artifact_editor/components/VersionHistory.tsx` | 版本历史 |
| `m16_artifact_editor/components/VersionDiff.tsx` | 版本对比 |
| `m16_artifact_editor/components/AttachmentManager.tsx` | 附件管理 |
| `m16_artifact_editor/components/AIBadge.tsx` | AI 生成标识 |
| `m16_artifact_editor/components/DocxPreview.tsx` | Word 文档预览 |
| `m16_artifact_editor/components/XlsxPreview.tsx` | Excel 文件预览 |
| `m16_artifact_editor/hooks/useArtifacts.ts` | 产出物数据 Hook |

---

## 四、全局依赖关系

```
M14a（骨架组件）
  └─→ M14b（项目联调）→ 填充真实数据到骨架
       └─→ 依赖 M8 WebSocket / M10 Recovery / M2 引擎 / M4 编排

M6（审核系统后端）
  └─→ M15（审核仪表盘）→ 展示审核数据 + 统计图表

M5（产出物管理后端）
  └─→ M16（产出物编辑）→ 展示/编辑产出物 + 预览 Skill 生成文件
```

## 五、完成标准

- [ ] M14b 全部完成（骨架联调、WebSocket 实时数据、RecoveryPanel）
- [ ] M15 全部完成（审核列表、详情、投票、批量审核、统计图表）
- [ ] M16 全部完成（产出物列表、查看、编辑、版本对比、附件管理）
- [ ] **M15 审核统计图表正确展示 `ipd-data-analysis` 生成的数据**
- [ ] **M16 Word 文档在线预览正确渲染**
- [ ] **M16 Excel 文件在线预览正确渲染为表格**
- [ ] **M16 提供 Skill 生成产出物的原始文件下载**
- [ ] 所有页面路由正确，无白屏
- [ ] WebSocket 连接正常，断线重连可用
- [ ] 组件适配 Ant Design 主题
- [ ] TypeScript 类型完整，无 any

## 六、参考文档

- `docx/api-design.md` — API 端点设计
- `MVPtext/CLAUDE.md` — 主开发规则
- `MVPtext/frontend/m15-review-dashboard/CLAUDE.md` — M15 模块详情
- `MVPtext/frontend/m16-artifact-editor/CLAUDE.md` — M16 模块详情
- `.claude/skills/ipd-xlsx/SKILL.md` — Excel 技能包
- `.claude/skills/ipd-docx/SKILL.md` — Word 技能包
- `.claude/skills/ipd-data-analysis/SKILL.md` — 数据分析技能包
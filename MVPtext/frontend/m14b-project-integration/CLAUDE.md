# M14b: 项目详情联调 — CLAUDE.md

> **模块编号**：M14b
> **模块名称**：项目详情联调（前端）
> **负责 Agent**：前端开发 E
> **开发周期**：Week 5-7
> **上游依赖**：M14a（项目骨架）、M8（实时通信）、M10（异常恢复）
> **下游被依赖**：无（终端页面）

> **与 M14a 的关系**：M14b 在 M14a 的目录中修改已有组件文件（AgentChat.tsx、ActivityList.tsx 等），不创建独立目录。M14b 的关键文件列表列出的是需要**修改/增强**的 M14a 文件，而非新建文件。M14a 提供骨架和 Mock 数据，M14b 接入真实 API 和 WebSocket 流式数据。

---

## 职责范围

M14b 在 M14a 骨架基础上完成全部交互联调：
1. **AgentChat 完整交互**：Agent 实时对话展示、流式输出、推理摘要
2. **活动交互**：活动开始/跳过/完成、人工输入弹窗、bypass 选项
3. **阶段推进**：推进到下一阶段、回退确认、门禁投票
4. **侧边栏小组件联调**：WebSocket 实时数据渲染
5. **RecoveryPanel 集成**：异常恢复面板的触发和交互
6. **AIBadge 集成**：所有 Agent 产出物显示 AI 标识
7. **DataExportNotice 集成**：云端 API 配置时弹出数据出境告知
8. **OnboardingGuide**：首次进入项目详情时的引导流程

---

## 输入依赖

| 依赖 | 来源 | 用途 |
|------|------|------|
| M14a 骨架 | M14a | 组件骨架 |
| 后端 M2 | 工作流引擎 | 阶段推进 API |
| 后端 M4 | Agent 编排 | Agent 对话 API |
| 后端 M8 | WebSocket | 流式输出 |
| 后端 M10 | 异常恢复（`POST /api/recovery/actions`、`/api/recovery/debate/{round_id}/resolve`、`/api/recovery/regenerate/{artifact_id}`） | RecoveryPanel 数据 |

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `components/AgentChat.tsx` | Agent 对话完整交互（流式输出 + 推理摘要） |
| `components/ActivityInteraction.tsx` | 活动交互（开始/跳过/完成/bypass） |
| `components/HumanInputModal.tsx` | 人工输入弹窗（含 3 种 bypass 选项） |
| `components/StageAdvanceModal.tsx` | 阶段推进确认弹窗 |
| `components/StageRollbackModal.tsx` | 阶段回退确认弹窗 |
| `components/GateVotingPanel.tsx` | 门禁投票面板 |
| `components/RecoveryPanel.tsx` | 异常恢复面板 |
| `components/AIBadge.tsx` | AI 生成内容标识 |
| `components/DataExportNotice.tsx` | 数据出境告知弹窗 |
| `components/OnboardingGuide.tsx` | 首次使用引导 |
| `hooks/useAgentChat.ts` | Agent 对话逻辑（流式接收 + 推理摘要） |
| `hooks/useActivityActions.ts` | 活动操作逻辑 |
| `hooks/useStageControl.ts` | 阶段控制逻辑 |

---

## 关键交互

### AgentChat 流式输出
```
用户点击"开始"活动
  → 后端开始 Agent 编排
  → WebSocket 推送 token 流
  → 前端逐字显示 Agent 输出
  → 输出完成 → 显示推理摘要（折叠）
  → 用户可点击展开完整推理链
```

### 人工输入弹窗
```
触发条件: 活动 human_input_required = true
弹窗内容:
  - 提示文本（从后端获取）
  - 文本输入区（可选）
  - 文件上传区（可选）
  - 三种 bypass 选项:
    [跳过本次] [自动通过直到异常] [让 Agent 自己查]
```

### RecoveryPanel
```
触发条件: 后端返回 recovery_action
面板内容:
  - 异常类型标题
  - 描述说明
  - 2-3 个恢复选项按钮
  - 用户选择后执行对应恢复动作
```

---

## 完成标准

- [ ] AgentChat 流式输出正常（逐字显示）
- [ ] 推理摘要正确显示（折叠/展开）
- [ ] 活动交互完整（开始/跳过/完成/bypass）
- [ ] 人工输入弹窗 3 种 bypass 选项可用
- [ ] 阶段推进和回退确认弹窗可用
- [ ] 门禁投票面板可用
- [ ] RecoveryPanel 4 种异常场景渲染正确
- [ ] AIBadge 在 Agent 产出物上正确显示
- [ ] DataExportNotice 在配置云端 API 时弹出
- [ ] OnboardingGuide 首次进入时触发
- [ ] 侧边栏小组件 WebSocket 实时数据渲染正确

---

## 禁止事项

1. **禁止 AgentChat 不显示推理摘要**
2. **禁止跳过人工输入时不给 bypass 选项**
3. **禁止阶段推进无确认弹窗**
4. **禁止 RecoveryPanel 只显示错误信息不提供操作按钮**
5. **禁止 AIBadge 在非 Agent 生成内容上显示**
6. **禁止 DataExportNotice 可以被永久跳过**（每次切换云端 API 都需重新确认）

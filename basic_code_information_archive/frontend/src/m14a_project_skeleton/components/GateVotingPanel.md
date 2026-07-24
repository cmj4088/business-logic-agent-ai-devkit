# m14a_project_skeleton/components/GateVotingPanel.tsx — 门禁投票面板组件

## 概述
M14b 新增组件，为每个门禁检查点提供投票交互面板。支持通过/驳回/弃权三种投票，显示投票历史记录，自动通过时显示特殊标识。

## 组件详细说明

### GateVotingPanel (FC)
- **功能**: 门禁投票交互面板
- **Props**: `GateVotingPanelProps`
  - `gate` (GateStatusData): 门禁数据
  - `gateResult` (GateVoteResult | null): 当前投票结果
  - `isVoting` (boolean): 是否正在投票
  - `onVote` (function): 投票回调 `(gateId: string, vote: 'approve' | 'reject' | 'abstain', comment?: string) => void`

## 投票规则

| 投票选项 | 按钮样式 | 说明 |
|---------|---------|------|
| 通过 (approve) | 绿色实心按钮 | 同意门禁通过 |
| 驳回 (reject) | 红色实心按钮 | 驳回门禁，需提供理由 |
| 弃权 (abstain) | 灰色边框按钮 | 不参与投票 |

## UI 结构
- 门禁名称和描述
- 门禁状态标签（pending/voting/passed/failed）
- 投票按钮（仅 pending 和 voting 状态显示）
- 投票结果展示（已投票后显示 approve/reject/abstain 结果）
- 自动通过标识（auto-approved badge）

## 关键逻辑
- 仅 `pending` 和 `voting` 状态的门禁显示投票按钮
- 已投票（`gateResult` 不为 null）时显示投票结果，隐藏投票按钮
- 驳回时可附带评论文本
- 投票中按钮禁用，防止重复投票
- 自动通过的门禁显示特殊 badge

## 依赖关系
- `react`: FC, useState
- `../types`: GateStatusData, GateVoteResult

## 注意事项
- 投票按钮在 `isVoting` 时全部禁用
- 驳回时建议填写评论说明原因
- 投票结果是单向的，一旦提交不可修改
- 自动通过标识用于单人模式下的门禁
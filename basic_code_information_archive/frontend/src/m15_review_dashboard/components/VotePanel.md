# m15_review_dashboard/components/VotePanel.tsx — 投票面板组件

## 概述
审核投票面板，提供通过/驳回/需要修改三个投票选项。驳回和需要修改需要填写理由。提交前弹出确认对话框。

## 组件详细说明

### VotePanel({ voting, voteError, onSubmitVote, onEscalate, disabled })
- **功能**: 投票面板 UI 组件
- **Props**: 
  - `voting` (boolean) — 投票中状态
  - `voteError` (string | null) — 投票错误信息
  - `onSubmitVote` (function) — 提交投票回调
  - `onEscalate` (function) — 审核升级回调
  - `disabled?` (boolean) — 禁用状态
- **状态管理**: `selectedVote`, `reason`, `showConfirm`
- **关键逻辑**:
  - 选择"通过"时不需要理由
  - 选择"驳回"或"需要修改"时需要填写理由
  - 点击"提交投票"弹出确认弹窗
  - 确认弹窗根据投票类型显示不同提示文字和颜色
  - 投票按钮颜色：通过绿色、驳回红色、需要修改橙色
- **UI 结构**: 白色卡片，投票按钮组 + 理由输入框 + 错误提示 + 确认弹窗 + 提交/升级按钮

## 依赖关系
- `react`: useState
- `../types`: VoteType, VOTE_TYPE_LABELS

## 注意事项
- 投票按钮使用 `disabled` 和 `voting` 双重控制禁用状态
- 确认弹窗的按钮颜色与投票类型对应
- `onSubmitVote` 调用后自动清空选择状态和理由
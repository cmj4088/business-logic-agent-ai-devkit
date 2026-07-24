# m14a_project_skeleton/components/StageAdvanceModal.tsx — 阶段推进确认弹窗

## 概述
M14b 新增组件，阶段推进前的确认弹窗。显示当前阶段→目标阶段的变化，强调推进不可逆，防止误操作。

## 组件详细说明

### StageAdvanceModal (FC)
- **功能**: 阶段推进确认弹窗
- **Props**: `StageAdvanceModalProps`
  - `isOpen` (boolean): 是否显示弹窗
  - `currentStage` (IPDStage): 当前阶段
  - `targetStage` (IPDStage): 目标阶段
  - `isOperating` (boolean): 是否正在执行推进
  - `onConfirm` (function): 确认推进回调
  - `onClose` (function): 关闭弹窗

## UI 结构
- 头部：标题"推进阶段" + 关闭按钮
- 阶段变化展示：
  - 当前阶段名称 + 描述
  - 箭头图标（→）
  - 目标阶段名称 + 描述
- 警告提示：推进后不可回退（除非走回退流程）
- 底部按钮：取消 + 确认推进

## 关键逻辑
- 使用 `STAGE_LABELS` 获取阶段中文名
- 使用 `STAGE_DESCRIPTIONS` 获取阶段描述
- 确认按钮在 `isOperating` 时显示"推进中..."且禁用

## 依赖关系
- `react`: FC
- `../types`: STAGE_LABELS, STAGE_DESCRIPTIONS
- `@/shared/types`: IPDStage

## 注意事项
- 弹窗不可通过点击遮罩层关闭（防止误触），必须点击取消或关闭按钮
- 确认按钮在操作中禁用，防止重复推进
- 阶段描述帮助用户理解各阶段含义
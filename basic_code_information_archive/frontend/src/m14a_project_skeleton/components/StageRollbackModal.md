# m14a_project_skeleton/components/StageRollbackModal.tsx — 阶段回退确认弹窗

## 概述
M14b 新增组件，阶段回退前的确认弹窗。要求用户填写回退原因，列出回退影响（产出物归档、审核重置、审计日志），防止误操作。

## 组件详细说明

### StageRollbackModal (FC)
- **功能**: 阶段回退确认弹窗
- **Props**: `StageRollbackModalProps`
  - `isOpen` (boolean): 是否显示弹窗
  - `currentStage` (IPDStage): 当前阶段
  - `targetStage` (IPDStage): 目标阶段（回退到哪个阶段）
  - `isOperating` (boolean): 是否正在执行回退
  - `onConfirm` (function): 确认回调 `(reason: string) => void`
  - `onClose` (function): 关闭弹窗

## UI 结构
- 头部：标题"回退阶段" + 警告图标 + 关闭按钮
- 阶段变化展示：
  - 当前阶段名称
  - 回退箭头（←）
  - 目标阶段名称
- 回退影响清单（3 项）：
  1. 当前阶段产出物将被归档
  2. 当前阶段审核状态将被重置
  3. 所有回退操作将被记录在审计日志中
- 回退原因：必填文本输入框
- 底部按钮：取消 + 确认回退

## 关键逻辑
- 回退原因 `reason` 为必填，为空时确认按钮禁用
- 使用 `STAGE_LABELS` 获取阶段中文名
- 确认按钮在 `isOperating` 时显示"回退中..."且禁用

## 依赖关系
- `react`: FC, useState
- `../types`: STAGE_LABELS
- `@/shared/types`: IPDStage

## 注意事项
- 回退原因必填，确保审计日志完整
- 弹窗不可通过点击遮罩层关闭
- 列出 3 项回退影响帮助用户理解后果
- 回退原因通过 `onConfirm` 回调传递给父组件
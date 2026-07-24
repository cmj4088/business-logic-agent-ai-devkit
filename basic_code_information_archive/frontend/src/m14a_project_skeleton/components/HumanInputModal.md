# m14a_project_skeleton/components/HumanInputModal.tsx — 人工输入弹窗组件

## 概述
M14b 新增组件，当活动需要人工输入或绕过时弹出。提供文本输入区、可选文件上传，以及 3 种 bypass 快捷操作按钮。

## 组件详细说明

### HumanInputModal (FC)
- **功能**: 人工输入弹窗，支持完成活动和 bypass 两种模式
- **Props**: `HumanInputModalProps`
  - `isOpen` (boolean): 是否显示弹窗
  - `activity` (Activity): 当前活动
  - `mode` ('complete' | 'bypass'): 弹窗模式
  - `isActing` (boolean): 是否正在执行
  - `onConfirm` (function): 确认回调 `(input: string, file?: File) => void`
  - `onBypass` (function): 绕过回调 `(bypassType: 'skip_once' | 'auto_pass' | 'agent_decide') => void`
  - `onClose` (function): 关闭弹窗

## UI 结构
- 头部：活动名称 + 模式标签（完成/绕过）
- 文本输入区：多行文本框，支持输入审核意见或补充信息
- 文件上传区（可选）：支持上传附件
- 底部按钮区：
  - complete 模式：确认按钮
  - bypass 模式：确认按钮 + 3 个 bypass 选项

## bypass 三种模式

| 按钮文本 | 模式 | 说明 |
|---------|------|------|
| 跳过本次 | `skip_once` | 仅跳过当前活动，下次仍需要处理 |
| 自动通过直到异常 | `auto_pass` | 后续同类活动自动通过，异常时恢复 |
| 让 Agent 自己决定 | `agent_decide` | Agent 自主判断是否完成 |

## 依赖关系
- `react`: FC, useState
- `../types`: Activity

## 注意事项
- 弹窗使用模态遮罩层，防止背景操作
- 文本输入非必填（bypass 模式下可为空）
- 操作中按钮禁用，防止重复提交
- 点击遮罩层或关闭按钮均可关闭弹窗
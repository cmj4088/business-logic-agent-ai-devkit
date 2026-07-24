# m14a_project_skeleton/components/ActivityInteraction.tsx — 活动交互卡片组件

## 概述
M14b 新增组件，为每个活动提供可交互的卡片式 UI。根据活动状态（待开始/进行中/已完成/已跳过）显示不同的操作按钮和视觉样式。

## 组件详细说明

### ActivityInteraction (FC)
- **功能**: 单个活动的交互式卡片
- **Props**: `ActivityInteractionProps`
  - `activity` (Activity): 活动数据
  - `isActing` (boolean): 是否正在执行操作
  - `onStart` (function): 开始活动回调
  - `onSkip` (function): 跳过活动回调
  - `onComplete` (function): 完成活动回调（打开 HumanInputModal）
  - `onBypass` (function): 绕过活动回调（打开 HumanInputModal）
- **关键逻辑**:
  - 状态颜色映射：
    - `pending` 灰色背景 + 待开始标签
    - `active` 蓝色背景 + 进行中标签
    - `completed` 绿色背景 + 已完成标签
    - `skipped` 琥珀色背景 + 已跳过标签
  - 按钮行为：
    - pending → 显示"开始"和"跳过"按钮
    - active → 显示"完成"和"绕过"按钮
    - completed/skipped → 无操作按钮
  - 操作中禁用所有按钮

## 状态按钮规则

| 活动状态 | 可用按钮 | 触发动作 |
|---------|---------|---------|
| pending | 开始、跳过 | onStart → start API, onSkip → skip API |
| active | 完成、绕过 | onComplete → 打开 HumanInputModal, onBypass → 打开 HumanInputModal |
| completed | 无 | 仅显示完成状态 |
| skipped | 无 | 仅显示跳过状态 |

## 依赖关系
- `react`: FC
- `../types`: Activity

## 注意事项
- 按钮禁用状态通过 `isActing` 统一控制
- "完成"和"绕过"按钮都会触发 HumanInputModal
- 活动描述过长时自动截断显示
# m14a_project_skeleton/components/OnboardingGuide.tsx — 首次使用引导组件

## 概述
M14b 新增组件，为新用户提供 4 步首次使用引导。以进度条形式展示步骤，支持跳过，记录完成状态到后端。

## 组件详细说明

### OnboardingGuide (FC)
- **功能**: 首次使用引导覆盖层
- **Props**: `OnboardingGuideProps`
  - `isOpen` (boolean): 是否显示引导
  - `completedSteps` (string[]): 已完成的步骤 ID 列表
  - `onComplete` (function): 完成步骤回调 `(stepId: string) => void`
  - `onFinish` (function): 完成全部引导回调

## 4 步引导内容

| 步骤 | ID | 标题 | 说明 |
|------|-----|------|------|
| 1 | `project_overview` | 项目概览 | 了解项目详情页的三栏布局 |
| 2 | `stage_control` | 阶段推进 | 了解 IPD 6 阶段和推进/回退操作 |
| 3 | `agent_chat` | Agent 对话 | 了解 Agent 对话区和流式输出 |
| 4 | `activities` | 活动管理 | 了解活动列表和人工输入操作 |

## UI 结构
- 半透明遮罩层
- 步骤进度条（4 步圆点连线）
- 当前步骤标题和说明
- 高亮区域（引导目标元素位置）
- 底部按钮：跳过 + 下一步/完成

## 关键逻辑
- 通过 `completedSteps` 数组跟踪进度
- 每完成一步调用 `onComplete` 回调记录到后端
- 所有步骤完成后调用 `onFinish` 关闭引导
- 支持跳过（点击跳过按钮关闭引导）
- 进度条显示当前步骤和已完成步骤的视觉差异

## 依赖关系
- `react`: FC
- `../types`: OnboardingStep

## 注意事项
- 引导状态通过 `fetchOnboardingState` API 在页面加载时获取
- 已完成的步骤不会重复显示
- 跳过引导后可通过设置重新开启
- 遮罩层确保用户专注于引导内容
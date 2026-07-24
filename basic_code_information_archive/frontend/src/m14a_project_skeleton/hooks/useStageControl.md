# m14a_project_skeleton/hooks/useStageControl.ts — 阶段控制 Hook

## 概述
M14b 新增 Hook，管理 IPD 阶段推进和回退操作。支持推进到下一阶段、回退到上一阶段、暂停和恢复项目等操作。

## Hook 详细说明

### useStageControl(projectId)
- **功能**: 阶段控制状态管理
- **参数**: `projectId` (string) — 项目 ID
- **返回值**: `UseStageControlReturn`
  - `isOperating` (boolean): 是否正在执行阶段操作
  - `error` (string | null): 操作错误信息
  - `advance` (async function): 推进阶段 `(targetStage: IPDStage) => Promise<boolean>`
  - `rollback` (async function): 回退阶段 `(targetStage: IPDStage, reason: string) => Promise<boolean>`
  - `clearError` (function): 清除错误状态

## 关键逻辑

### 阶段推进
- 调用 `advanceStage(projectId, targetStage)` API
- 推进前需要用户确认（通过 StageAdvanceModal）
- 推进不可逆，系统会记录审计日志

### 阶段回退
- 调用 `rollbackStage(projectId, targetStage, reason)` API
- 必须提供回退原因，系统会记录审计日志
- 回退影响：产出物归档、审核重置

### 暂停/恢复
- `pause` 调用 `pauseProject(projectId)` API
- `resume` 调用 `resumeProject(projectId)` API
- 返回 `Promise<boolean>` 表示操作是否成功

## 依赖关系
- `react`: useState, useCallback
- `../api`: advanceStage, rollbackStage, pauseProject, resumeProject
- `@/shared/types`: IPDStage

## 注意事项
- 操作互斥：`isOperating` 为 true 时禁止新操作
- 操作失败时 `error` 状态保留，需手动调用 `clearError` 清除
- 阶段推进和回退都有确认弹窗，防止误操作
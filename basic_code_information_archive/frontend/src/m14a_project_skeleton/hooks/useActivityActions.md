# m14a_project_skeleton/hooks/useActivityActions.ts — 活动操作 Hook

## 概述
M14b 新增 Hook，管理单个活动的生命周期操作：开始、跳过、完成（含人工输入）以及三种 bypass 模式。提供操作状态和错误处理。

## Hook 详细说明

### useActivityActions(projectId)
- **功能**: 活动操作状态管理
- **参数**: `projectId` (string) — 项目 ID
- **返回值**: `UseActivityActionsReturn`
  - `isActing` (boolean): 是否正在执行操作
  - `error` (string | null): 操作错误信息
  - `start` (async function): 开始活动 `(activityId: string) => Promise<boolean>`
  - `skip` (async function): 跳过活动 `(activityId: string) => Promise<boolean>`
  - `complete` (async function): 完成活动（含人工输入）`(activityId: string, input: string) => Promise<boolean>`
  - `bypass` (async function): 绕过活动，支持 3 种模式

## bypass 三种模式

| 模式 | 说明 | 请求参数 |
|------|------|---------|
| `skip_once` | 跳过本次 | 仅本次跳过，下次仍需要处理 |
| `auto_pass` | 自动通过直到异常 | 后续同类活动自动通过，直到出现异常 |
| `agent_decide` | 让 Agent 自己决定 | Agent 自主判断是否完成 |

## 关键逻辑
- 所有操作使用 `performActivityAction` API 统一处理
- 操作进行中 `isActing = true` 防止重复点击
- 操作失败时设置 `error` 状态，不抛出异常
- 返回值 `boolean` 表示操作是否成功

## 依赖关系
- `react`: useState, useCallback
- `../api`: performActivityAction

## 注意事项
- 操作互斥：同一时间只能执行一个操作
- `complete` 需要用户提供输入文本，用于人工审核场景
- bypass 模式通过 `action` 参数区分，后端根据模式执行不同逻辑
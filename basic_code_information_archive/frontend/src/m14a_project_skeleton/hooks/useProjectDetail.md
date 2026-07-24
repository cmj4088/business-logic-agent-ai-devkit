# m14a_project_skeleton/hooks/useProjectDetail.ts — 项目详情数据 Hook

## 概述
管理项目详情页的所有数据获取，使用 `Promise.all` 并行请求项目详情、阶段信息、活动列表和门禁状态，提供统一的 loading / error / isNotFound 状态。

## Hook 详细说明

### useProjectDetail(projectId)
- **功能**: 获取项目详情及相关数据
- **参数**: `projectId` (string)
- **返回值**: `ProjectDetailState & ProjectDetailActions`
  - `project` (ProjectDetail | null)
  - `stageData` (StageResponse | null)
  - `activities` (Activity[])
  - `gateStatuses` (GateStatusData[])
  - `isLoading` (boolean)
  - `isNotFound` (boolean)
  - `error` (string | null)
  - `refresh` (async function)
- **关键逻辑**:
  - 使用 `Promise.all` 并行请求 4 个 API，减少加载时间
  - 捕获异常时检查 `response.status === 404` 设置 `isNotFound`
  - `loadData` 使用 `useCallback` 防止不必要的重渲染
  - `useEffect` 依赖 `loadData`，projectId 变化时自动重新加载

## 依赖关系
- `react`: useState, useEffect, useCallback
- `../types`: ProjectDetail, StageResponse, Activity, GateStatusData
- `../api`: fetchProjectDetail, fetchStageDetail, fetchActivities, fetchGateStatus

## 注意事项
- 404 检测依赖 axios 错误对象结构，通过 `err.response.status` 判断
- 每次加载前重置 `isNotFound` 和 `error` 状态
- `refresh` 实际上是 `loadData` 的别名，完全重新加载所有数据
# m13_project_creation/api.ts — 项目创建模块 API 调用层

## 概述
项目创建模块的 API 调用封装，包含创建项目和获取阶段信息两个 API 函数。

## 函数/类型详细说明

### StageInfoData (接口)
- **功能**: 阶段信息数据结构
- **字段**: `stages` (string[]), `gates` (Record<string, string[]>)

### createProjectAPI(data)
- **功能**: 创建新项目
- **参数**: `data` (ProjectFormData)
- **返回值**: `Promise<Project>`
- **API 端点**: `POST /api/projects`

### getStageInfoAPI()
- **功能**: 获取工作流阶段信息
- **返回值**: `Promise<StageInfoData>`
- **API 端点**: `GET /api/workflows/stages`

## 依赖关系
- 导入 `get`, `post` from `@/shared/api-client`
- 导入 `Project` from `@/shared/types`
- 导入 `ProjectFormData` from `./types`

## 注意事项
- `createProjectAPI` 返回 `Project` 对象，包含新创建项目的 ID，可用于跳转
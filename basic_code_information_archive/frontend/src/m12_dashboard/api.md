# m12_dashboard/api.ts — Dashboard 模块 API 调用层

## 概述
Dashboard 模块的 API 调用封装，目前只包含一个获取 Dashboard 聚合数据的 API 函数。

## 函数详细说明

### fetchDashboardAPI()
- **功能**: 获取 Dashboard 聚合数据（用户信息、待处理任务、自动完成事项、项目列表、通知）
- **返回值**: `Promise<DashboardData>`
- **API 端点**: `GET /api/dashboard`

## 依赖关系
- 导入 `get` from `@/shared/api-client`
- 导入 `DashboardData` from `./types`

## 注意事项
- 当前 MVP 阶段只有一个 API 端点，后续可能扩展更多功能
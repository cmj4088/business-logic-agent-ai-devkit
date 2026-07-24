# shared/types.ts — 共享类型定义

## 概述
该文件是整个 Business Logic Agent 前端的核心类型定义文件，定义了 IPD 阶段、Agent 角色、编排模式、复杂度级别等关键枚举类型，以及项目、API 响应、分页等通用数据结构。所有业务模块均依赖此文件中的类型。

## 类型定义

### IPDStage
- **功能**: IPD 产品开发阶段枚举（6 个阶段）
- **可选值**: `'concept'` | `'plan'` | `'develop'` | `'verify'` | `'launch'` | `'lifecycle'`

### AgentRole
- **功能**: Agent 角色定义（6 个角色）
- **可选值**: `'product_manager'` | `'rd'` | `'qa'` | `'marketing'` | `'manufacturing'` | `'finance'`

### OrchestrationMode
- **功能**: Agent 编排模式
- **可选值**: `'parallel'` | `'sequential'` | `'debate'`

### ComplexityTier
- **功能**: 项目复杂度级别
- **可选值**: `'auto'` | `'lite'` | `'standard'` | `'full'`

### StageInfo
- **功能**: IPD 阶段信息
- **字段**: `stage` (IPDStage), `label` (string), `description` (string)

### AgentRoleInfo
- **功能**: Agent 角色信息
- **字段**: `role` (AgentRole), `label` (string), `description` (string)

### GateInfo
- **功能**: 门禁定义
- **字段**: `name` (string), `stage` (IPDStage), `label` (string), `description` (string)

### Project
- **功能**: 项目基本信息
- **字段**: `id` (string), `name` (string), `description` (string), `complexity` (ComplexityTier), `currentStage` (IPDStage), `createdAt` (string), `updatedAt` (string)

### ApiResponse\<T\>
- **功能**: API 响应包装
- **字段**: `data` (T), `message` (string), `success` (boolean)

### PaginationParams
- **功能**: 分页参数
- **字段**: `page` (number), `pageSize` (number)

### PaginatedResponse\<T\>
- **功能**: 分页响应
- **字段**: `items` (T[]), `total` (number), `page` (number), `pageSize` (number), `totalPages` (number)

## 依赖关系
- 无外部依赖，此文件为纯类型定义

## 注意事项
- 所有类型使用 `export type` 导出，确保 TypeScript 编译时类型擦除
- 其他模块通过 `@/shared/types` 路径导入这些类型
# m13_project_creation/types.ts — 项目创建模块类型定义

## 概述
定义项目创建模块（M13）所需的类型，包括项目表单数据、表单验证错误和复杂度预览信息。

## 类型定义

### ProjectFormData
- **功能**: 项目创建表单数据
- **字段**: `name` (string), `template_id` (string), `target_weeks` (number), `team_size` (number), `budget_limit` (number), `industry` (string), `description` (string)

### FormErrors
- **功能**: 表单验证错误，字段可选
- **字段**: `name?`, `target_weeks?`, `team_size?`, `budget_limit?`

### ComplexityPreview
- **功能**: 复杂度预览信息
- **字段**: `tier` (ComplexityTier), `reason` (string), `activity_count` (number), `estimated_duration` (string)

## 依赖关系
- 导入 `ComplexityTier` from `@/shared/types`

## 注意事项
- `FormErrors` 所有字段均为可选，有值表示该字段有错误
- `ComplexityPreview` 的 `estimated_duration` 为描述性文本（如"1-3 个月"）
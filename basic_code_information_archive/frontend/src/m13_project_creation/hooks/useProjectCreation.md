# m13_project_creation/hooks/useProjectCreation.ts — 项目创建 Hook

## 概述
管理项目创建表单的状态、验证和提交逻辑。根据行业和团队规模自动判定复杂度级别，提供表单字段更新和提交功能。

## 函数详细说明

### determineComplexity(formData)
- **功能**: 根据行业和团队规模自动判定复杂度
- **参数**: `formData` (Partial<ProjectFormData>)
- **返回值**: `ComplexityPreview`
- **关键逻辑**:
  - 医疗器械/汽车电子/航空行业：`full` 模式（34 个活动，6-12 个月）
  - 团队规模 <= 3 人：`lite` 模式（24 个活动，1-3 个月）
  - 其他：`standard` 模式（31 个活动，3-6 个月）

### validateForm(data)
- **功能**: 表单校验
- **参数**: `data` (Partial<ProjectFormData>)
- **返回值**: `FormErrors`
- **关键逻辑**:
  - 名称：2-50 字符
  - 目标时间：1-52 周
  - 团队规模：至少 1 人
  - 预算：不能为负数

### useProjectCreation()
- **功能**: 项目创建核心 Hook
- **返回值**: `{ formData, errors, isSubmitting, submitError, complexityPreview, updateField, handleSubmit }`
- **关键逻辑**:
  - `updateField`: 更新单个字段并实时校验
  - `handleSubmit`: 最终校验后调用 `createProjectAPI`，成功后跳转到项目详情页
  - 默认表单值：template_id 为 'standard_ipd_v3'，target_weeks 为 8，team_size 为 5，budget_limit 为 100000，industry 为 '消费电子'

## 依赖关系
- `react`: useState, useCallback
- `react-router-dom`: useNavigate
- `../types`: ProjectFormData, FormErrors, ComplexityPreview
- `../api`: createProjectAPI

## 注意事项
- 复杂度判定在前端完成，仅用于预览展示，最终以服务端为准
- 表单校验在每次字段更新时实时执行
- 提交前再次校验，双重保障
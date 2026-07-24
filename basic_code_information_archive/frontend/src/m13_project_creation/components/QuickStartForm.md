# m13_project_creation/components/QuickStartForm.tsx — 快速创建表单组件

## 概述
项目创建的核心表单组件，包含产品名称、模板选择、目标时间、团队规模、预算上限、行业选择、项目描述和复杂度预览等字段。集成表单验证和提交逻辑。

## 组件详细说明

### TEMPLATE_OPTIONS
- **功能**: 模板选项列表
- **值**: `[{ standard_ipd_v3: '硬件IPD' }, { software_ipd: '软件IPD' }, { medical_ipd: '医疗器械IPD' }, { custom: '自定义' }]`

### TEAM_SIZE_OPTIONS
- **功能**: 团队规模选项（单选按钮组）
- **值**: `[{ 1-5人: 3 }, { 6-20人: 10 }, { 20人+: 30 }]`

### QuickStartForm()
- **功能**: 快速创建表单 UI 组件
- **关键逻辑**:
  - 使用 `useProjectCreation` Hook 获取表单状态和操作方法
  - `isFormValid`: 计算所有必填字段是否有效
  - 表单字段使用 Tailwind 样式，错误状态红色边框
  - 团队规模使用 radio 按钮组（隐藏原生 radio，用样式模拟）
  - 提交按钮在表单无效或提交中时禁用
- **UI 结构**: 白色卡片式表单，各字段纵向排列

## 依赖关系
- `../hooks/useProjectCreation`: useProjectCreation
- `./IndustrySelector`: IndustrySelector
- `./ComplexityPreview`: ComplexityPreview

## 注意事项
- `template_id` 默认值为 `'standard_ipd_v3'`
- 数字输入框在清空时转为 0（而非 NaN）
- 团队规模使用 `sr-only` 隐藏原生 radio，用 label 样式模拟选中状态
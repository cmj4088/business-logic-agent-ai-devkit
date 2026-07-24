# m13_project_creation/components/IndustrySelector.tsx — 行业选择组件

## 概述
行业选择下拉框组件，选择行业后自动显示合规提醒信息。

## 组件/常量详细说明

### INDUSTRY_OPTIONS
- **功能**: 行业选项列表
- **值**: 消费电子、医疗器械、汽车电子、航空、软件、其他

### IndustrySelector({ value, onChange })
- **功能**: 行业选择下拉框 UI 组件
- **Props**: `value` (string) — 当前选中值, `onChange` (function) — 值变更回调
- **关键逻辑**: 选择行业后渲染 `ComplianceHints` 子组件显示合规提示
- **UI 结构**: label + select 下拉框 + ComplianceHints 提示

## 依赖关系
- `./ComplianceHints`: ComplianceHints

## 注意事项
- 行业选项与 `shared/constants.ts` 中的 `INDUSTRY_OPTIONS` 保持独立定义
- 合规提示根据行业自动显示，无特殊合规要求的行业显示"当前行业无特殊合规要求"
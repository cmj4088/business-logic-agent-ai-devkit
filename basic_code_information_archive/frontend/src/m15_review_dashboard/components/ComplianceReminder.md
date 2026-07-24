# m15_review_dashboard/components/ComplianceReminder.tsx — 行业合规提醒组件

## 概述
根据审核项的行业显示对应的合规要求列表，覆盖医疗器械、汽车电子、航空、消费电子和软件 5 个行业。

## 组件详细说明

### COMPLIANCE_RULES
- **功能**: 行业合规规则映射
- **值**: 5 个行业的合规规则数组，每个行业 4 条规则

### ComplianceReminder({ industry })
- **功能**: 合规提醒 UI 组件
- **Props**: `industry` (string)
- **关键逻辑**: 未找到对应行业规则时显示"暂无特定行业合规提示"
- **UI 结构**: 蓝色卡片，标题"{行业} 行业合规提醒"，规则列表

## 依赖关系
- `../types`: ComplianceRule

## 注意事项
- 与 m13 的 `ComplianceHints` 是不同模块的独立实现，规则更详细
- 规则列表使用蓝色圆点标记
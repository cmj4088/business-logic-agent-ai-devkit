# m13_project_creation/components/ComplianceHints.tsx — 合规提醒组件

## 概述
根据行业选择显示对应的合规提醒信息，帮助用户在创建项目时了解行业合规要求。

## 组件详细说明

### COMPLIANCE_HINTS
- **功能**: 行业合规提醒映射
- **值**:
  - 医疗器械：需要 NMPA/FDA 认证，预计 6-18 个月，建议完整模式
  - 汽车电子：需要 IATF 16949 认证
  - 航空：需要 DO-178C/DO-254 认证

### ComplianceHints({ industry })
- **功能**: 合规提醒 UI 组件
- **Props**: `industry` (string)
- **关键逻辑**: 没有对应行业的合规提示时显示"当前行业无特殊合规要求"
- **UI 结构**: 琥珀色警告卡片，显示合规提醒内容

## 依赖关系
- 无外部依赖

## 注意事项
- 只定义了 3 个有特殊合规要求的行业，其他行业显示通用提示
- 与 m15 的 `ComplianceReminder` 是不同模块的独立实现
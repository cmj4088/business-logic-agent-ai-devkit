# m14a_project_skeleton/components/SidebarPanel/SupplyChainWidget.tsx — 供应链小组件（骨架）

## 概述
供应链状态小组件的骨架容器，展示供应商、物料状态和交付周期信息。当前为静态占位，显示"数据加载中，将在后续版本完善"。

## 组件详细说明

### SupplyChainWidget({ projectId })
- **功能**: 供应链状态小组件
- **Props**: `projectId` (string) — 项目 ID（当前未使用）
- **关键逻辑**: 当前显示静态数据（全部正常，具体数据为 `--`）
- **UI 结构**: 白色卡片，标题"供应链"，状态指示器，供应商/物料/交付周期行

## 依赖关系
- `react`: FC

## 注意事项
- 骨架组件，所有数据字段显示 `--` 占位
- 后续版本需要接入真实供应链数据
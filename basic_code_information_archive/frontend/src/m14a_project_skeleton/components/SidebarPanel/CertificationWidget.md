# m14a_project_skeleton/components/SidebarPanel/CertificationWidget.tsx — 认证进度小组件（骨架）

## 概述
认证进度小组件的骨架容器，展示认证状态。当前显示"不适用"和"当前项目无需认证"，为静态占位。

## 组件详细说明

### CertificationWidget({ projectId })
- **功能**: 认证进度小组件
- **Props**: `projectId` (string) — 项目 ID（当前未使用）
- **关键逻辑**: 静态显示"不适用"状态
- **UI 结构**: 白色卡片，标题"认证进度"，居中显示占位符

## 依赖关系
- `react`: FC

## 注意事项
- 骨架组件，后续版本需要根据项目行业显示认证进度
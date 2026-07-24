# m16_artifact_editor/components/VersionDiff.tsx — 版本对比视图组件

## 概述
并排显示两个版本的差异，高亮变更部分。新增行绿色背景，删除行红色背景，未变更行无背景。顶部显示差异统计。

## 组件详细说明

### VersionDiff({ diff, onClose })
- **功能**: 版本对比视图 UI 组件
- **Props**: 
  - `diff` (VersionDiffType) — 版本对比数据
  - `onClose` (function) — 关闭对比视图回调
- **关键逻辑**:
  - 左侧（旧版本）：显示删除行和未变更行
  - 右侧（新版本）：显示新增行和未变更行
  - 统计新增/删除/未变更行数
  - 新增行前显示 `+` 前缀，删除行前显示 `-` 前缀
- **UI 结构**: 对比头部（统计信息 + 关闭按钮）+ 版本标签行 + 并排差异内容

## 依赖关系
- `../types`: VersionDiff as VersionDiffType

## 注意事项
- 使用等宽字体（`font-mono`）显示代码
- 最大高度 600px，超出可滚动
- 行号仅在变更行显示，未变更行隐藏
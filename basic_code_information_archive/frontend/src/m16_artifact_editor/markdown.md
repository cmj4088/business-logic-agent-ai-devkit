# m16_artifact_editor/markdown.ts — 简易 Markdown 渲染器

## 概述
纯前端的 Markdown 到 HTML 渲染器，支持常见 Markdown 语法。不依赖任何第三方库，输出带 CSS 类名的 HTML 字符串，可与 Tailwind CSS 样式配合使用。

## 函数详细说明

### renderMarkdown(markdown)
- **功能**: 将 Markdown 文本渲染为 HTML 字符串
- **参数**: `markdown` (string)
- **返回值**: string (HTML)
- **支持的语法**:
  - 代码块（```lang ... ```）
  - 行内代码（`code`）
  - 表格（Markdown 表格语法）
  - 标题（h1-h4）
  - 粗体（**text**）、斜体（*text*）、粗斜体（***text***）
  - 链接（[text](url)）
  - 图片（![alt](url)）
  - 无序列表（- 或 * 开头）
  - 有序列表（数字. 开头，支持嵌套缩进）
  - 引用（> 开头，连续引用自动合并）
  - 分割线（--- 或 *** 或 ___）
  - 段落（自动包裹非 HTML 标签的连续文本行）
- **关键逻辑**:
  - 先转义 HTML 特殊字符防止 XSS
  - 代码块内容二次转义
  - 列表支持缩进层级（每 2 个空格一级）
  - 段落识别：跳过已处理的 HTML 标签行，其余连续行包裹在 `<p>` 中

## 依赖关系
- 无外部依赖

## 注意事项
- 这是一个简易实现，复杂 Markdown 语法可能不支持
- 输出的 HTML 使用 `dangerouslySetInnerHTML` 渲染，需确保输入安全
- 表格渲染逻辑较复杂，对格式要求严格
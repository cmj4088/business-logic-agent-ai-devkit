# BLA AI Development Kit

> 此仓库包含 Business Logic Agent 项目的完整 AI 辅助开发工具包。
> 所有 AI 提示文件、开发规则、修改记录和任务分工说明均在此处。
> 配合 Claude Code / Cursor / Windsurf 等 AI 编程助手使用。

## 包结构说明

| 目录/文件 | 用途 | 使用方式 |
|-----------|------|----------|
| `CLAUDE.md` | 项目级 AI 指令 | 放在项目根目录，AI 自动读取 |
| `.claude/` | Claude Code 配置与 Skills | 自动加载 |
| `.trae/` | Trae IDE 配置 | 自动加载 |
| `personal-rules.md` | 个人编码规范 | 手动引入 AI 上下文 |
| `modification_log/` | 完整修改记录（含用户需求与提示词） | 回溯决策 / 分析历史 |
| `MVPtext/` | 子 Agent 任务分工说明 | 分配模块给子 Agent 时使用 |
| `basic_code_information_archive/` | 代码中文说明档案（镜像源码结构） | AI 修改代码前必读 |
| `skill/` | 项目临时 Skills | 按需加载 |
| `docx/` | 项目设计与需求文档 | 架构设计参考 |
| `AI_DEVKIT_GUIDE.md` | **本文件** — AI DevKit 使用说明 | - |

## CLAUDE.md 全局指令

项目根目录的 `CLAUDE.md` 是 AI 的核心行为指南，定义了：

- **语言偏好**：中文回答、技术名词保留原文、代码注释用中文
- **行为准则**：改代码前先读 basic_code_information_archive、不确定时搜索→文档→询问
- **目录结构规范**：docx/ backend/ frontend/ demo/ MVPtext/ modification_log/ skill/
- **代码编写规则**：Python 类型注解、TypeScript strict、API 统一响应格式
- **安全规范**：API Key 加密、敏感数据过滤、日志脱敏

将此文件放在任何 Claude Code 项目的根目录，AI 会自动遵循这些规则。

## 目录详细说明

### modification_log/
完整的项目修改历史，每条记录含：
- 用户原始需求原文
- 用户给的提示词
- 改动文件列表
- 改动说明
- 对应代码位置链接
- 对应 basic_code_information_archive 位置链接

### MVPtext/
子 Agent 任务分工，严格按模块化分工。
每个文件包含：任务概述、目标、具体任务列表、接口约定、注意事项。

### basic_code_information_archive/
用中文为每个代码文件编写详细说明，结构与源码镜像一致。
AI 在修改任何代码前，应先读此目录下对应的说明文件。

### docx/
项目设计文档，包含：
- `architecture-v5.md` — 系统架构设计
- `mvp-guide-v2.md` — MVP 完整指导
- `api-design.md` — API 端点设计
- `database-schema-v3.md` — 数据库 Schema
- `security-architecture-v2.md` — 安全架构设计
- `agent-system-prompts.md` — Agent 系统提示词

## 快速使用

```bash
# 将此仓库克隆到你的项目目录旁
git clone <this-repo-url> bla-ai-devkit

# 在项目中引用
# 将 CLAUDE.md 复制到你的项目根目录
# 其他目录按需参考
```

## 最佳实践

1. **新项目初始化**：复制 CLAUDE.md + docx/ 到新项目，AI 立刻理解项目背景
2. **代码审查**：对照 basic_code_information_archive 审查 AI 生成的代码
3. **任务分配**：用 MVPtext/ 格式编写子 Agent 任务，确保模块间接口清晰
4. **历史回溯**：用 modification_log/ 追溯之前的需求变更原因

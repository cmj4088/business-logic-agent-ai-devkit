# .trae/rules/ 代码说明

## 概述
.trae/rules/ 目录存放 Trae IDE 的自定义规则文件，将全局开发规则（语言偏好、行为准则、代码规范、文档格式）转换为 Trae 支持的 markdown 规则格式。每个规则文件通过 glob 字段指定作用范围，AI 根据文件名和 glob 自动匹配加载。

## 文件: general-rule.md
- **路径**: `.trae/rules/general-rule.md`
- **作用**: 通用开发规则 — 语言偏好（中文回答、技术名词保留英文、老公前缀）、行为准则（改前读档案、三步排查法、子 agent 分工后审查）、环境配置（Windows 11、Git Bash、UTF-8、LF）
- **glob**: `**/*`（全项目范围）
- **关键内容**:
  - 语言偏好 4 条
  - 行为准则 4 条
  - 环境配置 4 条
- **依赖关系**:
  - 参考来源: `C:\Users\32277\.claude\CLAUDE.md`（全局规则）
- **最后修改**: 2026-07-15
- **修改原因**: 将全局规则转换为 Trae IDE 可识别的规则格式

## 文件: python-rule.md
- **路径**: `.trae/rules/python-rule.md`
- **作用**: Python 后端开发规范 — FastAPI、Pydantic v2、SQLite 异步、模块化开发约束
- **glob**: `backend/**/*.py`
- **关键内容**:
  - 后端 M0-M10 模块结构表
  - 代码规范 4 条（类型注解/Pydantic v2/参数化查询/统一响应格式）
  - 模块规则 4 条（禁止跨模块导入/config 配置/docstring）
  - 数据安全 4 条（Fernet 加密/最小上下文/Ollama 数据不出境/日志脱敏）
- **依赖关系**:
  - 参考来源: `CLAUDE.md`（项目开发指南第四章/第七章）
- **最后修改**: 2026-07-15
- **修改原因**: 将项目后端规范转换为 Trae 格式

## 文件: typescript-react-rule.md
- **路径**: `.trae/rules/typescript-react-rule.md`
- **作用**: TypeScript/React 前端开发规范 — React 18、Ant Design 5.x、Zustand 状态管理
- **glob**: `frontend/**/*.{ts,tsx}`
- **关键内容**:
  - 前端 M11-M18 模块结构表
  - 代码规范 5 条（strict 模式/函数式组件/PascalCase/统一 API 封装/目录划分）
  - Electron 主进程文件说明
- **依赖关系**:
  - 参考来源: `CLAUDE.md`（项目开发指南第五章/第七章）
- **最后修改**: 2026-07-15
- **修改原因**: 将项目前端规范转换为 Trae 格式

## 文件: project-structure-rule.md
- **路径**: `.trae/rules/project-structure-rule.md`
- **作用**: 项目目录结构与文档格式规范 — 7 个核心目录要求、3 种文档模板格式
- **glob**: `**/*`（全项目范围）
- **关键内容**:
  - 完整目录结构树
  - 8 个目录（docx/backend/frontend/basic_code_information_archive/demo/MVPtext/modification_log/skill）详细要求
  - basic_code_information_archive 说明文件模板格式
  - modification_log 分类日志模板格式
  - MVPtext 任务分工文件模板格式
- **依赖关系**:
  - 参考来源: `C:\Users\32277\.claude\CLAUDE.md`（代码编写规则章节）
- **最后修改**: 2026-07-15
- **修改原因**: 将目录结构和文档格式规范转换为 Trae 格式

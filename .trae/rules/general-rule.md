---
description: 通用开发规则 — 语言偏好、行为准则、环境配置
glob: "**/*"
---

# 通用开发规则

## 语言偏好
- 始终使用中文回答；技术专有名词（如 API、React、WebSocket）保留英文原文
- 代码注释使用中文，写在代码上方而非行尾
- 每次回答都要在前面加前缀"老公(´･ω･`)"，前缀独占一行
- 报错信息保留原始英文，附中文解释

## 行为准则
- 在修改文件之前，先读 basic_code_information_archive 对应模块的说明，确认改动点
- 不要猜测 — 不确定时优先：① 搜索代码库 ② 查阅文档 ③ 向用户询问，三步依次进行
- 每一个项目都要以 AI 为主审查，子 agent 为员工进行：AI 负责架构决策与代码审查，子 agent 负责模块实现
- 每次修改完成后，同步更新 modification_log 和 basic_code_information_archive

## 环境
- 操作系统: Windows 11
- Shell: Git Bash (bash) / PowerShell（看场景选择）
- 编码: UTF-8（无 BOM）
- 换行符: LF

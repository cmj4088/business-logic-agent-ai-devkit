# feature-dev — 7阶段功能开发

## 概述
官方插件，提供结构化的 7 阶段工作流，系统化开发新功能。使用专用 agent（code-explorer、code-architect、code-reviewer）辅助代码库探索、架构设计和质量审查。

## 7个阶段

| 阶段 | 名称 | 说明 |
|------|------|------|
| 1 | Discovery 发现 | 澄清需求，识别约束，确认理解 |
| 2 | Exploration 探索 | 并行启动2-3个 code-explorer 探索代码库 |
| 3 | Clarification 澄清 | 识别边界情况、错误处理、集成点等未明确方面 |
| 4 | Architecture 架构 | 并行启动2-3个 code-architect 设计3种方案 |
| 5 | Implementation 实现 | 严格遵循代码库规范实现 |
| 6 | Quality Review 审查 | 并行启动3个 code-reviewer 审查 |
| 7 | Summary 总结 | 输出构建内容、关键决策、修改文件 |

## 调用方式
```
/feature-dev 开发XXX功能
```

## 适用场景
- ✅ 涉及多个文件的新功能
- ✅ 需要架构决策的功能
- ✅ 与现有代码的复杂集成
- ❌ 单行 bug 修复
- ❌ 简单琐碎的改动

## 本项目使用示例
```
/feature-dev 开发 M14b 项目集成，填充 AgentChat 和侧边栏小组件的交互逻辑
/feature-dev 创建 M15 评审仪表盘，含评审清单、投票和批量审核功能
/feature-dev 开发 M17 Agent配置页面，支持LLM后端切换和模型测试
/feature-dev 开发 M18 用量设置页面，含用量趋势图和预算预警
/feature-dev 开发 E0 Electron桌面壳，集成自动更新和安全存储
```
# Business Logic Agent — Skills 使用指南

## 已安装的 Skills（8个）

| 类型 | Skill | 安装命令 | 用途 |
|------|-------|---------|------|
| 官方 | feature-dev | 内置 | 7阶段结构化功能开发 |
| 官方 | code-review | 内置 | 4代理并行PR审查 |
| 官方 | pr-review-toolkit | 内置 | 6代理全面PR审查 |
| 官方 | commit-commands | 内置 | Git提交/推送/PR自动化 |
| 社区 | senior-frontend | `/plugin install senior-frontend` | React/TypeScript开发模式 |
| 社区 | backend-architect | `/plugin install backend-architect` | 后端架构/API设计 |
| 社区 | test-writer-fixer | `/plugin install test-writer-fixer` | 自动测试编写/修复 |
| 社区 | bug-fix | `/plugin install bug-fix` | 堆栈跟踪Bug分析 |

## 安装社区插件

在 Trae 中依次执行：
```
/plugin install senior-frontend
/plugin install backend-architect
/plugin install test-writer-fixer
/plugin install bug-fix
```

## 子agent使用指导

详见 [SUBAGENT_GUIDE.md](./SUBAGENT_GUIDE.md)

## 各Skill详细说明

- [feature-dev](./feature-dev/README.md) — 功能开发完整流程
- [code-review](./code-review/README.md) — 代码审查
- [pr-review-toolkit](./pr-review-toolkit/README.md) — 全面PR审查
- [commit-commands](./commit-commands/README.md) — Git工作流自动化
- [senior-frontend](./senior-frontend/README.md) — 前端开发模式
- [backend-architect](./backend-architect/README.md) — 后端架构设计
- [test-writer-fixer](./test-writer-fixer/README.md) — 测试自动化
- [bug-fix](./bug-fix/README.md) — Bug修复助手
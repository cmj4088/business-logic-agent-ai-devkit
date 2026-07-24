# code-review — 代码审查

## 概述
官方插件，通过并行启动4个专用代理独立审计代码变更，使用置信度评分系统过滤误报。

## 4个审查代理

| 代理 | 职责 |
|------|------|
| Agent #1 & #2 | CLAUDE.md 合规性（双冗余检查） |
| Agent #3 | 扫描变更中的明显 Bug |
| Agent #4 | git blame/历史分析上下文相关问题 |

## 置信度评分
- 0-25：误报，忽略
- 50：中等，真实但轻微
- 75-100：高度确信，必须修复
- **过滤阈值：80分以下的问题不报告**

## 调用方式
```
/code-review          # 输出到终端
/code-review --fix    # 自动修复发现的问题
```

## 本项目审查标准
- TypeScript strict 模式，不允许 `any`
- 参数化 SQL，禁止字符串拼接
- 中文 UI 文案
- 必须有 loading / error / empty 三态
- Tailwind CSS 样式
- 使用 `@/shared/api-client` 的 get/post/put/del

## 使用场景
- 子agent提交代码后，总监进行审查
- 合并前最终检查
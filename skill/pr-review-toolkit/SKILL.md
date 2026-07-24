# pr-review-toolkit — 全面PR审查

## 概述
官方插件，6个专业审查代理深度审查PR的各个方面。

## 6个审查代理

| 代理 | 审查维度 |
|------|---------|
| comment-analyzer | 代码注释准确性 |
| pr-test-analyzer | 测试覆盖率与质量 |
| silent-failure-hunter | 错误处理与静默失败 |
| type-design-analyzer | 类型设计质量 |
| code-reviewer | 通用代码审查 |
| code-simplifier | 代码简化与重构 |

## 调用方式
```
/pr-review-toolkit
```

## 使用场景
- 深度代码审查（比 code-review 更全面）
- 关键模块合并前审查
- 安全敏感代码审查

## 与 code-review 的区别
| 维度 | code-review | pr-review-toolkit |
|------|------------|-------------------|
| 代理数 | 4个 | 6个 |
| 深度 | 中等 | 深度 |
| 注释检查 | 无 | 有 |
| 测试检查 | 无 | 有 |
| 类型检查 | 无 | 有 |
| 速度 | 快 | 慢 |

## 建议
- 日常审查用 `/code-review`
- 关键模块用 `/pr-review-toolkit`
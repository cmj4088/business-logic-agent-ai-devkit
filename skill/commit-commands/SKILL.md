# commit-commands — Git工作流自动化

## 概述
官方插件，提供智能提交、推送和PR创建功能。

## 命令列表

| 命令 | 功能 |
|------|------|
| `/commit` | 智能提交（conventional commit格式） |
| `/push` | 推送代码 |
| `/create-pr` | 自动创建PR |

## 调用方式
```
/commit           # 分析变更，生成规范提交信息
/push             # 推送到远程
/create-pr        # 创建PR（含模板和标签）
```

## Conventional Commit 格式
```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

类型：feat / fix / docs / style / refactor / test / chore

## 本项目使用示例
```
/commit
# 自动生成: feat(m14b): 添加AgentChat实时对话组件
# 自动生成: fix(m5): 修复参数化SQL注入漏洞
# 自动生成: test(m10): 添加恢复管理器单元测试
```
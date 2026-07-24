# 子agent Skills 使用指导

> **重要：所有子agent在执行任务时，必须按照以下指导使用对应的 Skill。**

## 一、功能开发子agent（负责新建/修改模块）

### 必须使用：`/feature-dev`

```
使用场景：任何涉及多个文件的新功能开发或大型重构
执行流程：7阶段（发现→探索→澄清→架构→实现→审查→总结）
```

**使用方式：**
```
/feature-dev [功能描述]
```

**示例：**
```
/feature-dev 开发 M14b 项目集成模块，将 M14a 的骨架组件填充完整交互逻辑
/feature-dev 创建 M18 用量设置页面，包含用量概览图表和预算预警
```

**注意：**
- Phase 3（澄清问题）必须等待用户回答后才继续
- Phase 5（实现）必须等待用户明确批准才开始
- 不要跳过 Phase 2（代码库探索），必须先理解现有代码

---

## 二、代码审查子agent（负责审核代码）

### 必须使用：`/code-review`

```
使用场景：审查任何子agent提交的代码变更
审查维度：CLAUDE.md合规性 × 2 + Bug检测 + 历史分析
```

**使用方式：**
```
/code-review
```

**审查标准：**
- TypeScript strict 模式，不允许 `any`
- 参数化 SQL，禁止字符串拼接
- 中文 UI 文案
- 必须有 loading / error / empty 三态
- Tailwind CSS 样式
- 使用 `@/shared/api-client` 的 get/post/put/del

### 可选使用：`/pr-review-toolkit`（深度审查时）

```
使用场景：需要更全面的审查（注释质量、测试覆盖率、错误处理、类型设计）
6个专业代理：comment-analyzer / pr-test-analyzer / silent-failure-hunter / type-design-analyzer / code-reviewer / code-simplifier
```

---

## 三、提交代码子agent

### 必须使用：`/commit-commands`

```
使用场景：代码审查通过后提交代码
```

**使用方式：**
```
/commit  # 智能提交（conventional commit格式）
```

---

## 四、前端开发子agent

### 必须使用：`/senior-frontend`

```
使用场景：React/TypeScript 前端开发
包含：组件生成、bundle分析、无障碍检查、性能优化
```

---

## 五、后端开发子agent

### 必须使用：`/backend-architect`

```
使用场景：FastAPI 后端开发
包含：API设计、数据库Schema、系统架构
```

---

## 六、测试编写子agent

### 必须使用：`/test-writer-fixer`

```
使用场景：编写或修复测试用例
支持：Pytest（后端）、Vitest（前端）
```

**使用方式：**
```
/test-writer-fixer  # 自动分析并生成测试
```

---

## 七、Bug修复子agent

### 必须使用：`/bug-fix`

```
使用场景：收到错误报告或测试失败时
```

**使用方式：**
```
/bug-fix [错误信息或堆栈跟踪]
```

---

## 工作流集成

标准的子agent开发流程：

```
1. /feature-dev "开发XXX模块"     ← 功能开发
2. /test-writer-fixer              ← 编写测试
3. /code-review                    ← 代码审查
4. /bug-fix                        ← 修复发现的问题（如有）
5. /commit-commands                ← 提交代码
```

## 总监审核流程

当子agent完成工作后，总监（主agent）应：

```
1. /code-review 或 /pr-review-toolkit  ← 审查子agent代码
2. 人工判断是否通过
3. 不通过 → 返工，子agent用 /bug-fix 修复
4. 通过 → /commit-commands 提交，进入下一个链条
```
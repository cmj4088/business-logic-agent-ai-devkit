# types.py — 共享类型定义模块

## 概述
该文件定义了 Business Logic Agent 项目中使用的**核心枚举类型**，包括 IPD 阶段、Agent 角色、编排模式和复杂度级别。所有枚举继承 `str` 和 `Enum`，使其可以像字符串一样使用，同时保持类型安全。

## 枚举详细说明

### IPDStage（继承 str, Enum）
IPD 产品开发阶段枚举，共 6 个阶段。

| 枚举值 | 字符串值 | 中文含义 |
|--------|----------|----------|
| `CONCEPT` | `"concept"` | 概念阶段 |
| `PLAN` | `"plan"` | 计划阶段 |
| `DEVELOP` | `"develop"` | 开发阶段 |
| `VERIFY` | `"verify"` | 验证阶段 |
| `LAUNCH` | `"launch"` | 发布阶段 |
| `LIFECYCLE` | `"lifecycle"` | 生命周期管理阶段 |

### AgentRole（继承 str, Enum）
Agent 角色定义枚举，共 6 个角色。

| 枚举值 | 字符串值 | 中文含义 |
|--------|----------|----------|
| `PRODUCT_MANAGER` | `"product_manager"` | 产品经理 |
| `RD` | `"rd"` | 研发 |
| `QA` | `"qa"` | 质量保证 |
| `MARKETING` | `"marketing"` | 市场营销 |
| `MANUFACTURING` | `"manufacturing"` | 制造 |
| `FINANCE` | `"finance"` | 财务 |

### OrchestrationMode（继承 str, Enum）
Agent 编排模式枚举。

| 枚举值 | 字符串值 | 中文含义 | 说明 |
|--------|----------|----------|------|
| `PARALLEL` | `"parallel"` | 并行模式 | 多个 Agent 同时执行 |
| `SEQUENTIAL` | `"sequential"` | 串行模式 | Agent 按顺序依次执行 |
| `DEBATE` | `"debate"` | 辩论模式 | Agent 之间进行辩论和协商 |

### ComplexityTier（继承 str, Enum）
项目复杂度级别枚举。

| 枚举值 | 字符串值 | 中文含义 | 活动数 |
|--------|----------|----------|--------|
| `AUTO` | `"auto"` | 自动检测 | 系统自动判断复杂度 |
| `LITE` | `"lite"` | 轻量级 | 24 个活动 |
| `STANDARD` | `"standard"` | 标准级 | 31 个活动 |
| `FULL` | `"full"` | 完整级 | 34 个活动 |

## 与 constants.py 的关系

| types.py（枚举） | constants.py（常量列表） | 关系 |
|------------------|--------------------------|------|
| `IPDStage` | `IPD_STAGES` | 枚举提供类型安全，常量列表提供可迭代的字符串列表 |
| `AgentRole` | `AGENT_ROLES` | 同上 |
| `ComplexityTier` | `COMPLEXITY_ACTIVITY_COUNTS` | 枚举的字符串值作为字典的 key |

## 依赖关系
- `enum.Enum` — Python 枚举基类

## 注意事项
- 所有枚举继承 `str`，可以直接用于字符串比较、JSON 序列化和数据库存储
- 枚举值（字符串）与 `constants.py` 中的常量列表值保持一致
- 新增 IPD 阶段或 Agent 角色时，需要同时更新 `types.py` 和 `constants.py`
- 使用枚举而非裸字符串可以提高代码可读性，IDE 可以自动补全和类型检查
- `OrchestrationMode.AUTO` 表示系统自动选择编排模式，不同于手动指定
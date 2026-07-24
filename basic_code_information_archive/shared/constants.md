# constants.py — 全局常量定义模块

## 概述
该文件定义了 Business Logic Agent 项目中使用的所有**全局常量**，包括 IPD 阶段列表、Agent 角色列表、门禁列表、复杂度活动数等。这些常量供多个模块引用，确保数据一致性。

## 常量详细说明

### IPD_STAGES
- **类型**: `list[str]`
- **值**: `["concept", "plan", "develop", "verify", "launch", "lifecycle"]`
- **说明**: IPD 6 阶段（lite 模式）的阶段标识符列表
- **各阶段含义**:
  | 阶段 | 英文 | 中文含义 |
  |------|------|----------|
  | concept | Concept | 概念阶段 |
  | plan | Plan | 计划阶段 |
  | develop | Develop | 开发阶段 |
  | verify | Verify | 验证阶段 |
  | launch | Launch | 发布阶段 |
  | lifecycle | Lifecycle | 生命周期管理阶段 |

### AGENT_ROLES
- **类型**: `list[str]`
- **值**: `["product_manager", "rd", "qa", "marketing", "manufacturing", "finance"]`
- **说明**: 6 个 Agent 角色的标识符列表
- **各角色含义**:
  | 角色 | 英文 | 中文含义 |
  |------|------|----------|
  | product_manager | Product Manager | 产品经理 |
  | rd | R&D | 研发 |
  | qa | QA | 质量保证 |
  | marketing | Marketing | 市场营销 |
  | manufacturing | Manufacturing | 制造 |
  | finance | Finance | 财务 |

### GATES
- **类型**: `list[str]`
- **值**: `["CDCP", "PDCP", "TR3", "TR4", "TR5", "TR6", "ADCP", "LDCP"]`
- **说明**: IPD 流程中的门禁（Gate）列表，用于阶段评审和决策
- **各门禁含义**:
  | 门禁 | 全称 | 中文含义 |
  |------|------|----------|
  | CDCP | Concept Decision Check Point | 概念决策评审点 |
  | PDCP | Plan Decision Check Point | 计划决策评审点 |
  | TR3 | Technical Review 3 | 技术评审 3 |
  | TR4 | Technical Review 4 | 技术评审 4 |
  | TR5 | Technical Review 5 | 技术评审 5 |
  | TR6 | Technical Review 6 | 技术评审 6 |
  | ADCP | Availability Decision Check Point | 可获得性决策评审点 |
  | LDCP | Lifecycle Decision Check Point | 生命周期决策评审点 |

### COMPLEXITY_ACTIVITY_COUNTS
- **类型**: `dict[str, int]`
- **值**: `{"lite": 24, "standard": 31, "full": 34}`
- **说明**: 不同复杂度级别对应的活动数量
  - `lite`（轻量）：24 个活动
  - `standard`（标准）：31 个活动
  - `full`（完整）：34 个活动

### ERROR_PREFIXES
- **类型**: `list[str]`
- **值**: `["VALIDATION_", "NOT_FOUND", "FORBIDDEN_", "CONFLICT_", "LLM_", "AUTH_", "INTERNAL_"]`
- **说明**: 错误码前缀列表，用于错误码分类和识别
  | 前缀 | 对应错误类型 |
  |------|-------------|
  | `VALIDATION_` | 校验错误 |
  | `NOT_FOUND` | 资源未找到 |
  | `FORBIDDEN_` | 权限不足 |
  | `CONFLICT_` | 资源冲突 |
  | `LLM_` | LLM 服务错误 |
  | `AUTH_` | 认证错误 |
  | `INTERNAL_` | 内部错误 |

## 依赖关系
- 无外部依赖，仅使用 Python 内置类型

## 注意事项
- 这些常量应被视为**只读**，运行时不应修改
- 与 `types.py` 中的枚举类型配合使用，常量提供字符串列表，枚举提供类型安全
- IPD 阶段和 Agent 角色数量是固定的（各 6 个），不应随意增删
- 如果需要修改阶段或角色，应同时更新 `constants.py` 和 `types.py`
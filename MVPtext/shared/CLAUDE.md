# 共享模块 — CLAUDE.md

> **模块编号**：S0
> **模块名称**：共享模块（前后端共享代码）
> **位置**：`MVPtext/shared/`
> **开发周期**：Week 1-2（与 M0 同步）
> **上游依赖**：无
> **下游被依赖**：所有后端模块和前端模块

---

## 输入依赖

| 依赖 | 来源 | 用途 |
|------|------|------|
| 无外部模块依赖 | — | 共享模块是最底层，仅依赖标准库 |

---

## 输出接口

| 接口 | 类型 | 说明 |
|------|------|------|
| `shared/data_filter.py` | Python 模块 | 敏感数据过滤函数 |
| `shared/config.py` | Python 模块 | 统一配置加载 |
| `shared/types.py` | Python 模块 | Pydantic 共享类型定义 |
| `shared/constants.py` | Python 模块 | 全局常量 |
| `shared/errors.py` | Python 模块 | 统一错误码 |
| `shared/validators.py` | Python 模块 | 共享校验函数 |
| `shared/api-client.ts` | TypeScript 模块 | 前端 API 调用封装 |
| `shared/types.ts` | TypeScript 模块 | 前端类型定义 |
| `shared/constants.ts` | TypeScript 模块 | 前端常量 |

---

## 职责范围

`shared/` 目录存放前后端共用的类型定义、常量、校验规则和工具函数。避免前后端各维护一份相同逻辑。

---

## 关键文件

| 文件 | 语言 | 说明 |
|------|------|------|
| `shared/data_filter.py` | Python | 敏感数据过滤（身份证号、手机号、邮箱脱敏） |
| `shared/config.py` | Python | 统一配置加载（环境变量 + config.yaml） |
| `shared/types.py` | Python | Pydantic 模型：IPD 阶段、Agent 角色、产出物类型等共享枚举/类型 |
| `shared/constants.py` | Python | 全局常量：阶段名、角色名、错误码、门禁列表 |
| `shared/errors.py` | Python | 统一错误码和异常类定义 |
| `shared/validators.py` | Python | 共享校验函数（项目名称、邮箱格式、URL 格式等） |
| `shared/api-client.ts` | TypeScript | 前端 API 调用封装（axios 实例、拦截器、错误处理） |
| `shared/types.ts` | TypeScript | 前端类型定义（与 Python Pydantic 模型对应） |
| `shared/constants.ts` | TypeScript | 前端常量（与 Python constants.py 对应） |

---

## data_filter.py（核心安全组件）

```python
import re

def filter_sensitive_data(text: str) -> str:
    """过滤文本中的敏感信息，用于发送到 LLM 之前"""
    text = re.sub(r'\b\d{17}[\dXx]\b', '[身份证号已隐藏]', text)
    text = re.sub(r'\b1[3-9]\d{9}\b', '[手机号已隐藏]', text)
    text = re.sub(r'\b[\w.-]+@[\w.-]+\.\w+\b', '[邮箱已隐藏]', text)
    return text
```

**使用要求**：任何发送到 LLM 的文本都必须先调用此函数。

---

## 共享类型定义

### IPD 阶段（Python）
```python
from enum import Enum

class IPDStage(str, Enum):
    CONCEPT = "concept"
    PLAN = "plan"
    DEVELOP = "develop"
    VERIFY = "verify"
    LAUNCH = "launch"
    LIFECYCLE = "lifecycle"

class AgentRole(str, Enum):
    PRODUCT_MANAGER = "product_manager"
    RD = "rd"
    QA = "qa"
    MARKETING = "marketing"
    MANUFACTURING = "manufacturing"
    FINANCE = "finance"

class OrchestrationMode(str, Enum):
    PARALLEL = "parallel"
    SEQUENTIAL = "sequential"
    DEBATE = "debate"

class ComplexityTier(str, Enum):
    AUTO = "auto"
    LITE = "lite"
    STANDARD = "standard"
    FULL = "full"
```

### 对应 TypeScript 类型
```typescript
// shared/types.ts
export type IPDStage = 'concept' | 'plan' | 'develop' | 'verify' | 'launch' | 'lifecycle';
export type AgentRole = 'product_manager' | 'rd' | 'qa' | 'marketing' | 'manufacturing' | 'finance';
export type OrchestrationMode = 'parallel' | 'sequential' | 'debate';
export type ComplexityTier = 'auto' | 'lite' | 'standard' | 'full';
```

---

## 完成标准

- [ ] Python 和 TypeScript 类型定义一致（IPDStage, AgentRole, OrchestrationMode, ComplexityTier）
- [ ] data_filter.py 覆盖身份证号、手机号、邮箱三种敏感信息
- [ ] api-client.ts 统一封装（baseURL、错误拦截、Token 自动附带）
- [ ] 所有后端模块通过 `from shared import` 引用共享代码
- [ ] 所有前端模块通过 `@/shared/` 引用共享代码

---

## 禁止事项

1. **禁止在 shared 中引入框架级依赖**（FastAPI、React 等），只放纯逻辑
2. **禁止在 shared 中存储密钥或敏感配置**
3. **禁止 TypeScript 和 Python 类型定义不一致**（修改时两边同步更新）
4. **禁止 data_filter.py 被绕过**（所有 LLM 调用路径必须经过过滤）
5. **禁止 shared 模块直接访问数据库或文件系统**

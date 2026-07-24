# models.py — Pydantic 数据模型

## 概述
该文件定义了 M4 Agent 编排模块中 API 请求的 Pydantic 数据模型。这些模型用于 FastAPI 路由的请求体验证和序列化，确保输入数据符合预期格式。

## 函数/类详细说明

### OrchestrateRequest（Pydantic BaseModel）
Agent 编排请求的数据模型，用于 `/api/agents/orchestrate` 端点。

#### 字段
| 字段名 | 类型 | 默认值 | 约束 | 说明 |
|--------|------|--------|------|------|
| `project_id` | str | 必填 | — | 项目唯一标识 |
| `stage` | str | 必填 | — | 当前阶段名称 |
| `activity_key` | str | 必填 | — | 活动标识符 |
| `mode` | OrchestrationMode | `SEQUENTIAL` | — | 编排模式（PARALLEL/SEQUENTIAL/DEBATE） |
| `agents` | list[str] | 必填 | — | 参与的 Agent 角色列表 |
| `user_input` | str | `""` | — | 用户附加上下文 |
| `max_rounds` | int | `3` | 1-10 | 最大辩论轮次（仅 DEBATE 模式有效） |

### AgentConfigRequest（Pydantic BaseModel）
Agent 配置请求的数据模型，用于配置单个 Agent 的参数。

#### 字段
| 字段名 | 类型 | 默认值 | 约束 | 说明 |
|--------|------|--------|------|------|
| `role` | str | 必填 | — | Agent 角色标识 |
| `model` | str | `"ollama"` | — | 使用的模型名称 |
| `temperature` | float | `0.7` | 0.0-2.0 | LLM 温度参数 |
| `max_tokens` | int | `32000` | 1024-128000 | 最大 Token 数 |

### ModelTestRequest（Pydantic BaseModel）
模型测试请求的数据模型，用于 `/api/agents/models/test` 端点。

#### 字段
| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `model` | str | 必填 | 要测试的模型名称 |
| `provider` | str | `"ollama"` | 提供商（ollama/anthropic/openai） |

## 依赖关系
- `pydantic.BaseModel`: Pydantic 基础模型类
- `pydantic.Field`: 字段定义和验证约束
- `typing.Optional`: 可选类型标注
- `shared.types.OrchestrationMode`: 编排模式枚举
- `shared.types.AgentRole`: Agent 角色枚举（已导入但未在当前文件中使用）

## 注意事项
- AgentRole 被导入但未在当前文件的任何模型中使用，可能是预留的导入
- max_rounds 的约束范围是 1-10，超出范围会被 Pydantic 自动拒绝
- OrchestrationMode 枚举类型确保 mode 字段只能是有效值，非法值会被自动拒绝
- 所有模型都使用 Pydantic v2 风格的 Field 定义
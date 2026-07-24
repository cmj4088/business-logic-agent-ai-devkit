# models.py — M9 用量追踪 Pydantic 数据模型

## 概述
该文件定义了 M9 用量追踪模块中使用的 Pydantic 请求/响应模型。目前仅包含一个模型 `UsageLimitUpdate`，用于接收前端提交的用量限制更新请求。

## 类详细说明

### UsageLimitUpdate
- **功能**: 定义用量限制的更新请求体，用于 PUT `/api/usage/limits` 接口。
- **字段**:
  - `max_tokens` (`int`): 必填，最大 Token 数量，必须 >= 1。通过 `Field(..., ge=1)` 做了下限校验。
  - `period` (`str`): 选填，默认值为 `"monthly"`。限制周期，可选值为 `daily` 或 `monthly`。
  - `is_active` (`bool`): 选填，默认值为 `True`。表示该限制是否启用。
- **关键逻辑**: 使用 Pydantic 的 `Field` 校验器确保 `max_tokens` 至少为 1，在请求到达路由之前就完成数据校验。

## 依赖关系
- `pydantic.BaseModel`: 基础模型类，提供数据校验和序列化功能。
- `pydantic.Field`: 用于字段级别的元数据定义和校验规则。

## 注意事项
- 该模型不包含 `id` 字段，因为 `id` 在服务层通过 `uuid.uuid4()` 自动生成。
- 该模型仅用于请求体校验，不用于数据库查询结果映射。
- 如果后续需要新增限制类型（如按成本限制），需要扩展此模型。
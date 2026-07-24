# models.py — Pydantic 请求模型

## 概述
该文件定义了 M5 产出物管理模块的 Pydantic 请求/响应模型，用于 FastAPI 接口的请求体验证和序列化。所有模型使用 Pydantic 的 `BaseModel` 和 `Field` 进行声明式定义，提供自动校验和文档生成能力。

## 函数/类详细说明

### ArtifactCreateRequest
- **功能**: 创建产出物时的请求体模型。
- **字段**:
  - `project_id` (str): 必填，项目 ID，用于关联产出物到具体项目。
  - `artifact_type` (str): 必填，产出物类型标识（如 `mrd`、`prd`、`system_design` 等）。
  - `name` (str): 必填，产出物名称，长度限制 1-200 字符。
  - `content` (str): 产出物内容（Markdown 格式），默认值为空字符串。
  - `stage` (str): 必填，所属 IPD 阶段标识。
- **关键逻辑**: 使用 `Field(...)` 表示必填字段，`Field(default="")` 表示可选字段带默认值。

### ArtifactUpdateRequest
- **功能**: 更新产出物时的请求体模型。
- **字段**:
  - `content` (str): 必填，更新后的 Markdown 内容。
  - `change_summary` (str): 变更摘要，默认值为空字符串，用于描述本次修改的内容。
- **关键逻辑**: 相比创建模型更简洁，只需要提供需要更新的内容字段。

## 依赖关系
- `pydantic.BaseModel` / `Field`: 模型基类和字段声明。
- `typing.Optional`: 可选类型标注（虽然当前文件中未实际使用，但作为常用导入保留）。

## 注意事项
- `ArtifactCreateRequest` 中的 `name` 字段有长度校验（1-200），超出范围会触发 Pydantic 验证错误。
- `ArtifactUpdateRequest` 只需要 `content` 字段，因为更新操作不改变产出物的名称、类型、阶段等元信息。
- 这两个模型仅用于请求验证，响应模型直接使用 Python 字典，未定义专门的响应 Pydantic 模型。
- Pydantic 会自动将无效的请求体转换为 422 验证错误响应，无需在路由层手动处理。
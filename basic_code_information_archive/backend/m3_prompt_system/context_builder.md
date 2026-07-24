# context_builder.py — 上下文构建器

## 概述
该文件是 M3 提示词系统的上下文构建模块，负责从数据库（项目表、产出物表）中提取结构化数据，构建用于渲染提示词模板的上下文字典。它为提示词渲染提供项目信息、阶段信息和已有产出物列表等上下文变量。

## 函数/类详细说明

### build_context(db, project_id, stage, user_input)
- **功能**: 构建提示词渲染所需的完整上下文数据
- **参数**:
  - `db: AsyncSession` — SQLAlchemy 异步数据库会话
  - `project_id: str` — 项目 ID
  - `stage: str | None` — 当前阶段名称（可选，若不传则使用项目当前阶段）
  - `user_input: str | None` — 用户输入文本（可选）
- **返回值**: `dict` — 渲染上下文字典，结构如下：
  ```python
  {
      "project": {
          "name": str,           # 项目名称
          "description": str,    # 项目描述
          "complexity_tier": str, # 复杂度等级
          "current_stage": str,  # 当前阶段
          "industry": str,       # 行业类型
          "team_size": int,      # 团队规模
          "budget_limit": float, # 预算上限
      },
      "stage": {
          "name": str,           # 阶段名称
      },
      "artifacts": [
          {
              "name": str,       # 产出物名称
              "type": str,       # 产出物类型
              "stage": str,      # 所属阶段
              "version": str,    # 版本号
              "summary": str,    # 摘要（格式: "v{version}, {type}"）
              "created_at": str, # 创建时间
          },
          ...
      ],
      "user_input": str,         # 用户输入
  }
  ```
- **关键逻辑**:
  1. 初始化默认上下文字典（空值兜底）
  2. 查询 `projects` 表获取项目基础信息，填充 `context["project"]`
  3. 确定目标阶段：优先使用传入的 `stage` 参数，否则使用项目当前阶段，均无则默认为 `"concept"`
  4. 查询 `artifacts` 表获取该项目最近 10 个产出物（按创建时间倒序），填充 `context["artifacts"]`
  5. 每个产出物的 `summary` 字段为 `"v{version}, {artifact_type}"` 格式的简要描述

## 依赖关系
- `sqlalchemy.text` — 原生 SQL 查询
- `sqlalchemy.ext.asyncio.AsyncSession` — 异步数据库会话

## 注意事项
- 该函数是异步函数，调用时需要使用 `await`
- 产出物查询限制为最近 10 条（`LIMIT 10`），若项目产出物较多，旧产出物不会被包含在上下文中
- 产出物查询排除已软删除的记录（`deleted_at IS NULL`）
- 当项目不存在时，`context["project"]` 保持为空字典 `{}`，不会抛出异常，模板渲染时需处理空值
- `summary` 字段的格式比较简单，可能在后续版本中需要替换为 AI 自动生成的摘要
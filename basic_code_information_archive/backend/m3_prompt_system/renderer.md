# renderer.py — Jinja2 渲染器

## 概述
该文件是 M3 提示词系统的核心渲染模块，负责加载和渲染 Agent 系统提示词模板。使用 Jinja2 模板引擎，支持从文件系统加载自定义模板或回退到内置默认模板。渲染过程中集成敏感数据过滤和用户输入安全包裹。

## 函数/类详细说明

### TEMPLATES_DIR（常量）
- **功能**: 模板文件目录的绝对路径
- **值**: `renderer.py` 所在目录下的 `templates` 子目录
- **用途**: Jinja2 `FileSystemLoader` 的加载路径

### DEFAULT_TEMPLATES（常量）
- **功能**: 内置默认提示词模板字典，当模板文件不存在时使用
- **结构**: `dict[str, str]`，键为角色标识，值为 Jinja2 模板字符串
- **包含的角色模板**:
  - `product_manager` — 产品经理模板
  - `rd` — 研发架构师模板
  - `qa` — 测试专家模板
  - `marketing` — 市场专家模板
  - `manufacturing` — 制造工程师模板
  - `finance` — 财务分析师模板
- **模板结构**: 每个模板包含项目信息、已有产出物列表、角色职责和安全约束五个部分
- **模板变量**: `{{ project.name }}`、`{{ stage.name }}`、`{{ project.complexity_tier }}`、`{{ project.industry }}`、`{% for artifact in artifacts %}` 等

### ROLE_NAMES（常量）
- **功能**: 角色标识到中文名称的映射
- **映射关系**:
  - `product_manager` → `"产品经理"`
  - `rd` → `"研发架构师"`
  - `qa` → `"测试专家"`
  - `marketing` → `"市场专家"`
  - `manufacturing` → `"制造工程师"`
  - `finance` → `"财务分析师"`

### 类: PromptRenderer
- **功能**: 提示词渲染器，封装模板加载、渲染和验证功能
- **构造参数**: 无
- **关键逻辑**: 初始化 Jinja2 `Environment`，使用 `FileSystemLoader` 加载模板目录，`autoescape=False`（不自动转义 HTML）

#### get_template_content(role)
- **功能**: 获取指定角色的模板原始内容（未渲染的 Jinja2 源码）
- **参数**: `role: str` — Agent 角色标识
- **返回值**: `str` — 模板原始内容
- **关键逻辑**:
  1. 先尝试从 `templates/{role}.j2` 文件加载模板内容
  2. 若文件不存在，回退到 `DEFAULT_TEMPLATES` 字典
  3. 若字典中也不存在该角色，抛出 `AppException` 404 错误

#### render(role, context)
- **功能**: 渲染提示词模板，生成最终的 system prompt 字符串
- **参数**:
  - `role: str` — Agent 角色标识
  - `context: dict` — 渲染上下文，包含 `project`、`stage`、`artifacts`、`user_input` 等
- **返回值**: `str` — 渲染后的完整 system prompt 文本
- **关键逻辑**:
  1. 调用 `get_template_content` 获取模板内容
  2. 若上下文中存在 `user_input`，先调用 `filter_sensitive_data` 过滤敏感数据，再用 `<user_input>` XML 标签包裹
  3. 补充默认上下文：`project`（默认 `{}`）、`stage`（默认 `{}`）、`artifacts`（默认 `[]`）、`role_name`（从 `ROLE_NAMES` 查找）
  4. 使用 Jinja2 `from_string` 编译模板并渲染

#### validate_template(content)
- **功能**: 验证 Jinja2 模板语法是否正确
- **参数**: `content: str` — 模板内容字符串
- **返回值**: `tuple[bool, str | None]` — `(是否有效, 错误信息)`，若有效则错误信息为 `None`
- **关键逻辑**: 尝试用 `env.from_string` 编译模板，捕获异常并返回错误信息

## 依赖关系
- `os` — 文件路径操作
- `jinja2.Environment`, `FileSystemLoader` — Jinja2 模板引擎
- `shared.data_filter.filter_sensitive_data` — 敏感数据过滤
- `shared.errors.ErrorCode`, `AppException` — 错误码和异常类

## 注意事项
- `autoescape=False` 意味着模板渲染不会自动转义 HTML，这是因为提示词是纯文本，不需要 HTML 转义
- 模板文件命名约定为 `{role}.j2`，存放在 `templates/` 子目录下
- 默认模板中硬编码了大量中文提示词内容，修改角色行为需要修改 `DEFAULT_TEMPLATES` 字典
- 模板中使用了 Jinja2 的 `{% if not artifacts %}` 条件判断和 `{% for artifact in artifacts %}` 循环语法
- 安全约束部分在每个模板中重复出现，未抽取为公共模板片段，后续可考虑使用 Jinja2 的 `{% include %}` 或模板继承
- `render` 方法在渲染前对 `user_input` 进行安全处理，但未对 `project.name` 等其他用户可控字段做过滤，若这些字段可能包含恶意内容，需要额外处理
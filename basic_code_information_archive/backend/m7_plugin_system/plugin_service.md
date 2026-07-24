# plugin_service.py — 插件业务逻辑层

## 概述
该文件是 M7 插件系统的核心业务逻辑层，包含 `PluginService` 类，负责插件的安装、配置管理、启用/禁用、卸载、测试连接以及插件市场浏览等全部业务操作。MVP 阶段仅内置 `web_search` 插件，支持 DuckDuckGo、SerpAPI、Brave 三种搜索引擎。该文件还包含敏感配置的加密/解密/脱敏工具函数。

## 常量/全局变量

### BUILTIN_PLUGINS
- **功能**: 内置插件定义字典，以插件 ID 为键。
- **内容**: 当前仅包含 `web_search` 插件，定义了名称、版本、描述、分类、配置 schema（含 `search_api_key`、`search_engine`、`max_results`、`timeout` 四个配置项）和两个工具（`web_search` 搜索工具和 `fetch_url` URL 抓取工具）。
- **关键逻辑**: 每个工具的 `tool_schema` 以 JSON 字符串形式存储，遵循 OpenAI function calling 格式。

### SENSITIVE_CONFIG_KEYS
- **功能**: 需要加密存储的配置键名集合。
- **内容**: `{"search_api_key", "api_key", "api_secret", "token", "password"}`。
- **关键逻辑**: 这些键名的配置值在存储前会被加密，在响应时会被脱敏。

## 函数详细说明

### _generate_id()
- **功能**: 生成唯一记录 ID。
- **参数**: 无。
- **返回值**: `str` — 格式为 `"plugin_"` + 12 位十六进制随机字符串。
- **关键逻辑**: 使用 `uuid.uuid4().hex[:12]` 生成 12 位十六进制字符。

### _now()
- **功能**: 获取当前 UTC 时间字符串。
- **参数**: 无。
- **返回值**: `str` — 格式为 `"YYYY-MM-DD HH:MM:SS"`。
- **关键逻辑**: 使用 `datetime.now(timezone.utc)` 获取 UTC 时间。

### _mask_sensitive_config(config)
- **功能**: 对配置中的敏感字段进行脱敏处理。
- **参数**:
  - `config` (`dict`): 原始配置字典。
- **返回值**: `dict` — 脱敏后的配置字典，敏感字段的值替换为 `"***"`。
- **关键逻辑**: 遍历配置字典，若键名在 `SENSITIVE_CONFIG_KEYS` 中且值非空，则替换为 `"***"`。

### _encrypt_sensitive_config(config)
- **功能**: 对配置中的敏感字段进行加密存储。
- **参数**:
  - `config` (`dict`): 原始配置字典。
- **返回值**: `dict` — 加密后的配置字典，敏感字段使用 Fernet 加密。
- **关键逻辑**: 调用 `m1_auth_security.security.encrypt_api_key` 对敏感字段值进行加密。

### _decrypt_sensitive_config(config)
- **功能**: 对配置中的敏感字段进行解密。
- **参数**:
  - `config` (`dict`): 加密后的配置字典。
- **返回值**: `dict` — 解密后的配置字典。
- **关键逻辑**: 调用 `m1_auth_security.security.decrypt_api_key` 解密，解密失败时保留原值（兼容未加密的历史数据）。

## 类详细说明

### PluginService
- **功能**: 插件服务类，封装所有插件业务逻辑。
- **构造函数**:
  - `__init__(self, db: AsyncSession)`: 接收一个异步数据库会话实例。

#### 已安装插件管理

##### list_plugins()
- **功能**: 获取已安装的插件列表。
- **参数**: 无。
- **返回值**: `list[dict]` — 插件列表，按安装时间降序排列。
- **关键逻辑**: 查询 `plugin_configs` 表，对每个插件调用 `_get_plugin_tools` 获取工具列表，配置使用 `_mask_sensitive_config` 脱敏。

##### get_plugin(plugin_id)
- **功能**: 获取单个插件详情。
- **参数**:
  - `plugin_id` (`str`): 插件 ID。
- **返回值**: `dict | None` — 插件详情字典，未安装时返回 `None`。
- **关键逻辑**: 查询 `plugin_configs` 表按 `plugin_id` 匹配，返回单条记录。

##### install_plugin(plugin_id, config)
- **功能**: 安装插件（MVP 仅支持内置插件）。
- **参数**:
  - `plugin_id` (`str`): 插件 ID。
  - `config` (`dict`): 用户提供的插件配置。
- **返回值**: `dict` — 安装后的插件详情。
- **异常**:
  - `AppException(404)`: 插件不存在（不在 `BUILTIN_PLUGINS` 中）。
  - `AppException(409)`: 插件已安装（重复安装）。
- **关键逻辑**: 合并默认配置（`search_engine=duckduckgo`、`max_results=5`、`timeout=10`）和用户配置，加密敏感字段后同时插入 `plugin_configs` 和 `plugin_tools` 两张表，最后提交事务。

##### update_plugin(plugin_id, config, enabled)
- **功能**: 更新插件配置和/或启用状态。
- **参数**:
  - `plugin_id` (`str`): 插件 ID。
  - `config` (`dict | None`): 新配置（与现有配置合并）。
  - `enabled` (`bool | None`): 是否启用。
- **返回值**: `dict` — 更新后的插件详情。
- **异常**:
  - `AppException(404)`: 插件未安装。
- **关键逻辑**: 先解密现有配置，与新配置合并后再加密存储；启用状态更新时转换为整数 0/1。

##### toggle_plugin(plugin_id, enabled)
- **功能**: 启用/禁用插件（`update_plugin` 的简化封装）。
- **参数**:
  - `plugin_id` (`str`): 插件 ID。
  - `enabled` (`bool`): 是否启用。
- **返回值**: `dict` — 更新后的插件详情。
- **关键逻辑**: 直接委托给 `update_plugin`，仅传入 `enabled` 参数。

##### uninstall_plugin(plugin_id)
- **功能**: 卸载插件，删除所有相关数据。
- **参数**:
  - `plugin_id` (`str`): 插件 ID。
- **返回值**: `None`。
- **异常**:
  - `AppException(404)`: 插件未安装。
- **关键逻辑**: 先删除 `plugin_tools` 表中的工具记录，再删除 `plugin_configs` 表中的配置记录，最后提交事务。

#### 插件市场

##### get_available_plugins()
- **功能**: 获取可用插件市场列表。
- **参数**: 无。
- **返回值**: `list[dict]` — 可用插件列表，已安装的插件标记 `installed=True`。
- **关键逻辑**: 查询已安装的插件 ID 集合，遍历 `BUILTIN_PLUGINS` 为每个插件标记安装状态，工具 schema 从 JSON 字符串解析为字典。

#### 测试连接

##### test_plugin(plugin_id)
- **功能**: 测试插件连接是否正常。
- **参数**:
  - `plugin_id` (`str`): 插件 ID。
- **返回值**: `dict` — 包含 `success`、`message`、`plugin_id` 的测试结果。
- **异常**:
  - `AppException(404)`: 插件未安装。
- **关键逻辑**: 先检查插件是否启用，未启用则直接返回失败；MVP 阶段对 `web_search` 插件调用 `_test_web_search` 进行实际测试，其他插件默认返回成功。

##### _test_web_search(plugin)
- **功能**: 测试 web_search 插件的连接。
- **参数**:
  - `plugin` (`dict`): 插件详情字典。
- **返回值**: `dict` — 测试结果。
- **关键逻辑**:
  - 若搜索引擎为 `duckduckgo`：使用 `httpx.AsyncClient` 向 DuckDuckGo API 发送测试请求，检查 HTTP 状态码，捕获网络异常。
  - 若搜索引擎为 `serpapi` 或 `brave`：检查 API Key 是否已配置（解密后判断），若未配置则返回失败。
  - 注意：该函数导入 `httpx` 是延迟导入（在函数内部 `import httpx`），避免非 DuckDuckGo 场景下不必要的依赖加载。

#### 内部方法

##### _get_raw_plugin(plugin_id)
- **功能**: 获取原始插件记录，不做解密和脱敏处理。
- **参数**:
  - `plugin_id` (`str`): 插件 ID。
- **返回值**: SQLAlchemy Row 对象或 `None`。
- **关键逻辑**: 直接返回数据库原始行，用于内部需要解密配置的场景。

##### _get_plugin_tools(plugin_id)
- **功能**: 获取插件的工具列表。
- **参数**:
  - `plugin_id` (`str`): 插件 ID。
- **返回值**: `list[dict]` — 工具列表，每个工具包含 `id`、`tool_name` 和解析后的 `tool_schema`。
- **关键逻辑**: 查询 `plugin_tools` 表，将 `tool_schema` 从 JSON 字符串解析为字典。

## 依赖关系
- `json`: JSON 序列化/反序列化。
- `uuid`: 生成唯一 ID。
- `datetime.datetime, timezone`: 时间处理。
- `sqlalchemy.text`: 原生 SQL 执行。
- `sqlalchemy.ext.asyncio.AsyncSession`: 异步数据库会话。
- `shared.errors.ErrorCode, AppException`: 统一错误处理。
- `m1_auth_security.security.encrypt_api_key, decrypt_api_key`: API Key 加密/解密。
- `httpx`: 延迟导入，用于测试 DuckDuckGo 连接。

## 注意事项
- 该服务在每个请求中通过 `PluginService(db)` 实例化，生命周期与请求绑定。
- 配置的加密和解密依赖于 `m1_auth_security` 模块的 Fernet 加密实现。
- `_test_web_search` 中 `httpx` 的导入是延迟导入，这意味着如果 `httpx` 未安装，DuckDuckGo 测试会失败，但不影响其他功能。
- 当前 MVP 阶段仅支持从 `BUILTIN_PLUGINS` 安装，不支持外部插件市场或动态加载。
- 数据库操作使用原生 SQL（`text()`），而非 ORM 模型，与其他模块风格一致。
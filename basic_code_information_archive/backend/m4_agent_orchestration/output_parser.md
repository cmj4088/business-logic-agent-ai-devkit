# output_parser.py — 输出解析器

## 概述
该文件实现了 M4 Agent 编排模块中的 LLM 输出解析功能。LLM 的输出可能包含 JSON 格式的结构化数据，但也可能被 Markdown 代码块包裹或夹杂其他文本。该模块提供多级降级策略来提取 JSON，确保尽可能解析出结构化数据。

## 函数/类详细说明

### parse_json_output()
- **功能**: 尝试从 LLM 原始输出中解析 JSON，采用多级降级策略
- **参数**:
  - `text` (str): LLM 的原始输出文本
  - `max_retries` (int): 最大重试次数，默认 2（保留参数，实际由调用方控制）
- **返回值**: dict[str, Any] — 包含以下字段：
  - `parsed` (bool): 是否成功解析为 JSON
  - `content` (Any): 解析后的 JSON 对象或原始文本
  - `raw` (str): 原始文本
- **关键逻辑**（四级降级策略）:
  1. **直接解析**: 尝试 `json.loads()` 直接解析整个文本
  2. **提取 Markdown 代码块**: 使用正则 ` ```json ... ``` ` 提取 JSON 代码块并解析
  3. **提取花括号块**: 使用正则 `{...}` 提取第一个花括号包裹的内容并解析
  4. **降级为纯文本**: 前三步都失败时，返回原始文本，parsed=False

### extract_json_with_retry()
- **功能**: 带重试标记的 JSON 提取，用于 LLM 重试场景
- **参数**:
  - `text` (str): LLM 的原始输出文本
  - `max_retries` (int): 最大重试次数，默认 2
- **返回值**: dict[str, Any] — 包含 parse_json_output() 的所有字段，额外包含：
  - `needs_retry` (bool): 是否需要重试（解析失败时为 True）
- **关键逻辑**: 调用 parse_json_output()，根据 parsed 字段设置 needs_retry 标记

## 依赖关系
- `json`: 标准库，JSON 解析
- `re`: 标准库，正则表达式匹配
- `typing.Any`: 类型标注

## 注意事项
- 花括号提取正则 `\{.*\}` 使用贪婪匹配，可能匹配到嵌套 JSON 的最外层，在正则的 DOTALL 模式下可以跨行匹配
- 正则 ` ```json ... ``` ` 使用 DOTALL 模式，可以匹配跨行的代码块
- max_retries 参数在 parse_json_output 中未被实际使用，仅作为接口保留；实际重试控制由调用方（如 orchestrator）负责
- 如果 LLM 输出包含多个 JSON 块，只会提取第一个匹配到的
- 降级为纯文本时，调用方需要自行处理非结构化数据
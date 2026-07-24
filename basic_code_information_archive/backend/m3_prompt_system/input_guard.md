# input_guard.py — 输入防护

## 概述
该文件是 M3 提示词系统的输入安全防护模块，负责对用户输入进行安全处理，防止 prompt injection（提示词注入）攻击。核心策略是将系统指令和用户输入严格分离，用户输入只作为分析对象，不作为指令执行。

## 函数/类详细说明

### wrap_user_input(text)
- **功能**: 将用户输入包裹在 `<user_input>` XML 标签内，防止 prompt injection
- **参数**: `text: str` — 用户原始输入
- **返回值**: `str` — XML 标签包裹后的文本，格式为 `<user_input>\n{安全文本}\n</user_input>`
- **关键逻辑**:
  1. 若输入为空，返回空标签 `<user_input>\n\n</user_input>`
  2. 先调用 `filter_sensitive_data` 过滤敏感数据（身份证号、手机号等）
  3. 将过滤后的文本包裹在 `<user_input>` 标签中

### wrap_system_instruction(text)
- **功能**: 将系统指令包裹在 `<system_instruction>` XML 标签内
- **参数**: `text: str` — 系统指令文本
- **返回值**: `str` — 格式为 `<system_instruction>\n{文本}\n</system_instruction>`
- **关键逻辑**: 纯标签包裹，不做额外处理

### sanitize_user_input(text)
- **功能**: 对用户输入进行多层安全处理
- **参数**: `text: str` — 用户原始输入
- **返回值**: `str` — 安全处理后的文本
- **关键逻辑**:
  1. 若输入为空，直接返回空字符串
  2. 调用 `filter_sensitive_data` 过滤敏感数据
  3. 遍历 `injection_patterns` 列表，将匹配到的 prompt injection 模式替换为 `[已过滤: pattern...]`
  4. 过滤的注入模式包括：
     - `"ignore previous instructions"` — 忽略之前的指令
     - `"ignore all previous"` — 忽略所有之前的
     - `"disregard previous"` — 无视之前的
     - `"forget your instructions"` — 忘记你的指令
     - `"you are now"` — 你现在是
     - `"new instructions:"` — 新指令
     - `"system prompt:"` — 系统提示词
     - `<system_instruction>` / `</system_instruction>` — 系统指令标签（防止标签注入）
     - `<user_input>` / `</user_input>` — 用户输入标签（防止标签注入）

## 依赖关系
- `shared.data_filter.filter_sensitive_data` — 敏感数据过滤函数

## 注意事项
- `sanitize_user_input` 和 `wrap_user_input` 是两个独立的处理函数，前者用于需要直接使用文本的场景，后者用于需要 XML 包裹的场景
- `sanitize_user_input` 的过滤方式是简单的字符串替换（`str.replace`），大小写敏感，无法防御变体攻击（如大小写混用、零宽字符）
- 敏感数据过滤依赖 `shared.data_filter` 模块的实现，需要确保该模块已正确配置
- 注入模式列表为硬编码，后续如需扩展需要修改代码，建议考虑配置化
- 过滤后的替换文本 `[已过滤: pattern[:20]...]` 会暴露用户尝试注入的行为，有助于审计
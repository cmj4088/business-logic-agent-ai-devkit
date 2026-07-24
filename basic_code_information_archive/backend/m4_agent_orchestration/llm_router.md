# llm_router.py — LLM 路由器

## 概述
该文件是 M4 Agent 编排模块的核心组件之一，实现了统一的 LLM 调用接口。它封装了对三种 LLM 提供商（Ollama 本地模型、Anthropic Claude API、OpenAI GPT API）的调用逻辑，并集成了熔断器实现自动降级切换。当首选提供商不可用时，自动按降级链尝试下一个提供商。

## 函数/类详细说明

### LLMRouter（类）
LLM 路由器，负责模型选择、降级切换和实际 API 调用。

#### FALLBACK_CHAIN（类属性）
- **功能**: 定义降级链顺序
- **值**: `["ollama", "anthropic", "openai"]`
- **说明**: 优先使用 Ollama 本地模型（免费），失败后依次尝试 Anthropic 和 OpenAI

#### __init__()
- **功能**: 初始化路由器，为每个提供商创建独立的熔断器
- **参数**: 无（从全局配置获取设置）
- **关键逻辑**:
  - 从 `get_settings()` 获取配置
  - 为 FALLBACK_CHAIN 中的每个提供商创建 CircuitBreaker 实例
  - 熔断器的 max_failures 和 retry_after_seconds 从配置中读取
  - 注意 retry_after_seconds 需要将配置中的分钟数乘以 60 转换为秒

#### call()（异步方法）
- **功能**: 调用 LLM，自动降级切换
- **参数**:
  - `system_prompt` (str): 系统提示词
  - `user_message` (str): 用户消息
  - `model` (str | None): 指定模型名称，默认 None（使用各提供商的默认模型）
  - `provider` (str): 首选提供商，默认 "ollama"
  - `temperature` (float): 温度参数，默认 0.7
  - `max_tokens` (int): 最大 Token 数，默认 32000
  - `output_format` (str | None): 输出格式提示（JSON schema），默认 None
- **返回值**: dict — `{"content": str, "model": str, "provider": str, "tokens": {"input": int, "output": int}}`
- **关键逻辑**:
  - 先通过 `filter_sensitive_data()` 过滤敏感数据
  - 构建尝试列表：首选提供商在前，其余按降级链排列
  - 依次尝试每个提供商：先检查熔断器状态，再调用具体 API，成功则记录成功并返回
  - 如果 AppException 被抛出，直接向上传播（不降级）
  - 如果其他异常被捕获，记录失败并继续尝试下一个提供商
  - 所有提供商都失败后，抛出 AppException（错误码 LLM_ERROR，状态码 502）

#### _call_provider()（异步私有方法）
- **功能**: 根据提供商名称路由到具体的调用方法
- **参数**: 同 call() 的核心参数
- **返回值**: dict — 统一的调用结果格式
- **关键逻辑**: 简单的 if/elif 分支路由，不支持未识别的提供商

#### _call_ollama()（异步私有方法）
- **功能**: 调用 Ollama REST API
- **参数**: 同 call() 的核心参数，无 provider
- **返回值**: dict — 统一格式的调用结果
- **关键逻辑**:
  - 使用 `/api/generate` 端点（非 chat 端点）
  - 将 system_prompt 和 user_message 拼接为单个 prompt 字符串
  - 设置 stream=False 确保获取完整响应
  - 从响应中提取 eval_count 和 prompt_eval_count 作为 Token 计数
  - 使用 httpx.AsyncClient 进行异步 HTTP 调用，超时时间从配置读取

#### _call_anthropic()（异步私有方法）
- **功能**: 调用 Anthropic Claude API
- **参数**: 同 call() 的核心参数，无 provider
- **返回值**: dict — 统一格式的调用结果
- **关键逻辑**:
  - 从环境变量 ANTHROPIC_API_KEY 获取 API Key，未配置则抛出异常
  - 默认模型为 "claude-sonnet-4-5"
  - 使用 Messages API 端点 `/v1/messages`
  - 如果指定了 output_format，将其追加到 system prompt 中
  - 响应中的 content 是数组，取第一个元素
  - Token 计数从 usage 字段提取

#### _call_openai()（异步私有方法）
- **功能**: 调用 OpenAI Chat Completions API
- **参数**: 同 call() 的核心参数，无 provider
- **返回值**: dict — 统一格式的调用结果
- **关键逻辑**:
  - 从环境变量 OPENAI_API_KEY 获取 API Key，未配置则抛出异常
  - 默认模型为 "gpt-4o"
  - 使用标准 Chat Completions 端点
  - 将 system_prompt 和 user_message 分别放入 messages 数组
  - 响应中取 choices[0].message.content
  - Token 计数从 usage 字段提取

#### test_connection()（异步方法）
- **功能**: 测试指定提供商的模型连接
- **参数**:
  - `provider` (str): 提供商名称
  - `model` (str | None): 模型名称，默认 None
- **返回值**: dict — `{"success": bool, "model"?: str, "provider"?: str, "latency_ms"?: int, "tokens"?: dict, "error"?: str}`
- **关键逻辑**:
  - 发送一个简单的测试消息 "请回复 'OK' 表示连接正常。"
  - 记录请求耗时（毫秒）
  - 成功时返回模型信息、延迟和 Token 统计
  - 失败时返回 success=False 和错误信息

## 依赖关系
- `time`: 标准库，用于测试连接时的延迟计算
- `httpx`: 第三方异步 HTTP 客户端库
- `typing.Any`: 类型标注
- `m0_infrastructure.config.get_settings`: 获取全局配置
- `shared.data_filter.filter_sensitive_data`: 敏感数据过滤
- `shared.errors.ErrorCode, AppException`: 错误处理
- `.circuit_breaker.CircuitBreaker`: 熔断器

## 注意事项
- Anthropic 和 OpenAI 调用需要配置对应的环境变量 API Key，否则会直接抛出异常，不会降级
- Ollama 调用使用的是 `/api/generate` 端点（非 Chat 端点），prompt 是拼接后的单一字符串，而非 messages 数组
- 熔断器是按提供商维度独立管理的，每个提供商有独立的失败计数
- 调用时先过滤敏感数据再发送，保护用户隐私
- 所有 HTTP 调用使用统一的超时配置 `llm_timeout`
- 降级链中，如果 provider 已经排在最前面，不会重复尝试
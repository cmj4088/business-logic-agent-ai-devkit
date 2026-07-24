# orchestrator.py — Agent 编排器

## 概述
该文件是 M4 Agent 编排模块的核心，实现了三种 Agent 协作模式的编排逻辑：并行模式（Parallel）、顺序模式（Sequential）和辩论模式（Debate）。它负责协调 LLM 调用、上下文构建、语言检测、死循环检测和推理摘要生成，并将结果持久化到数据库。

## 函数/类详细说明

### generate_round_id()
- **功能**: 生成唯一的轮次 ID
- **参数**: 无
- **返回值**: str — 格式为 `"round_" + 12 位十六进制随机字符串`
- **关键逻辑**: 使用 uuid4 生成随机 UUID，取前 12 位十六进制字符

### Orchestrator（类）
Agent 编排器，管理 Agent 协作的完整生命周期。

#### __init__()
- **功能**: 初始化编排器
- **参数**:
  - `db` (AsyncSession): SQLAlchemy 异步数据库会话
- **关键逻辑**: 创建 LLMRouter 和 PromptRenderer 实例

#### orchestrate()（异步方法）
- **功能**: 执行 Agent 编排的主入口方法
- **参数**:
  - `project_id` (str): 项目 ID
  - `stage` (str): 当前阶段
  - `activity_key` (str): 活动标识
  - `mode` (OrchestrationMode): 编排模式
  - `agents` (list[str]): 参与的 Agent 角色列表
  - `user_input` (str): 用户附加上下文，默认 ""
  - `max_rounds` (int): 最大辩论轮次，默认 3
- **返回值**: dict — 包含 round_id、mode、outputs、summary、tokens
- **关键逻辑**:
  - 生成唯一 round_id
  - 调用 `build_context()` 构建上下文
  - 根据 mode 分发到不同的执行方法
  - 调用 `generate_reasoning_summary()` 生成摘要
  - 汇总所有 Agent 的 Token 消耗
  - 调用 `_save_round()` 将结果持久化到数据库

#### _run_parallel()（异步私有方法）
- **功能**: 并行模式 — 所有 Agent 同时独立输出
- **参数**:
  - `agents` (list[str]): Agent 角色列表
  - `context` (dict): 上下文信息
- **返回值**: list[dict] — 各 Agent 的输出结果列表
- **关键逻辑**: 使用 `asyncio.gather()` 并发执行所有 Agent 调用，每个 Agent 独立处理相同的上下文

#### _run_sequential()（异步私有方法）
- **功能**: 顺序模式 — Agent A 输出后，Agent B 基于 A 的输出继续
- **参数**:
  - `agents` (list[str]): Agent 角色列表
  - `context` (dict): 上下文信息
- **返回值**: list[dict] — 按顺序排列的 Agent 输出列表
- **关键逻辑**:
  - 第一个 Agent 使用原始上下文
  - 后续 Agent 的 user_input 会包含前一个 Agent 的完整输出和初始任务
  - shared_context 通过 `previous_output` 字段传递前一个 Agent 的输出

#### _run_debate()（异步私有方法）
- **功能**: 辩论模式 — 多轮辩论，直到达成共识或死循环检测触发
- **参数**:
  - `agents` (list[str]): Agent 角色列表
  - `context` (dict): 上下文信息
  - `max_rounds` (int): 最大辩论轮次
- **返回值**: list[dict] — 所有轮次的所有 Agent 输出
- **关键逻辑**:
  - 创建 DeadlockDetector 实例
  - 循环执行 max_rounds 轮辩论
  - 每轮中，所有 Agent 依次输出
  - 从第二轮开始，将之前所有轮次的输出摘要（前 200 字符）附加到上下文中
  - 每轮结束后调用死循环检测，如果检测到死循环则提前终止
  - 每个输出都标记所属的轮次编号

#### _invoke_agent()（异步私有方法）
- **功能**: 调用单个 Agent 并处理重试逻辑
- **参数**:
  - `agent_role` (str): Agent 角色标识
  - `context` (dict): 上下文信息
- **返回值**: dict — 包含 role、role_name、content、model、provider、tokens，失败时包含 error
- **关键逻辑**:
  - 使用 PromptRenderer 渲染 system prompt
  - 最多重试 3 次（max_attempts=3）
  - 每次调用后进行语言检测（检查是否为中文），非中文时在重试提示中加入 "请用中文回答"
  - 如果所有重试都失败，返回包含错误信息的降级输出
  - 即使失败也返回结构化的错误信息，不会抛出异常

#### _save_round()（异步私有方法）
- **功能**: 将编排轮次的结果保存到数据库
- **参数**:
  - `round_id` (str): 轮次 ID
  - `project_id` (str): 项目 ID
  - `stage` (str): 阶段名称
  - `activity_key` (str): 活动标识
  - `mode` (str): 编排模式
  - `agents` (list[str]): Agent 角色列表
  - `outputs` (list[dict]): 输出结果列表
  - `summary` (str): 推理摘要
  - `tokens` (dict): Token 统计
- **返回值**: None
- **关键逻辑**:
  - 遍历所有 outputs，将有效 Token 消耗（输入或输出 > 0）写入 usage_records 表
  - 每条记录包含：id、project_id、model、input_tokens、output_tokens、cost_usd（Ollama 免费，固定为 0）、created_at
  - 使用原始 SQL 语句（`text()`）执行插入
  - 最后提交事务

## 依赖关系
- `uuid`: 标准库，生成唯一 ID
- `asyncio`: 标准库，并发执行并行模式
- `datetime.datetime, timezone`: 标准库，时间戳处理
- `sqlalchemy.text`: 原始 SQL 执行
- `sqlalchemy.ext.asyncio.AsyncSession`: 异步数据库会话
- `shared.types.OrchestrationMode`: 编排模式枚举
- `m3_prompt_system.renderer.PromptRenderer, ROLE_NAMES`: 提示词渲染和角色名称映射
- `m3_prompt_system.context_builder.build_context`: 上下文构建
- `.llm_router.LLMRouter`: LLM 路由器
- `.deadlock_detector.DeadlockDetector`: 死循环检测器
- `.output_parser.extract_json_with_retry`: JSON 输出解析（已导入但未在 orchestrator 中使用）
- `.language_detector.check_language`: 语言检测
- `.reasoning_summarizer.generate_reasoning_summary`: 推理摘要生成

## 注意事项
- `extract_json_with_retry` 被导入但未在 orchestrator 中使用，可能在其他模块或未来功能中使用
- `_save_round()` 中 cost_usd 固定为 0.0，因为当前主要使用 Ollama 免费模型；如果后续支持付费 API，需要实现费用计算
- 辩论模式中的上下文传递只取前 200 字符的摘要，以避免上下文过长
- 并行模式中所有 Agent 独立处理相同的上下文，适合互不依赖的任务分解
- 顺序模式中，后续 Agent 可以看到前一个 Agent 的完整输出
- 语言检测重试机制：非中文时不是直接失败，而是修改 user_message 提示要求输出中文
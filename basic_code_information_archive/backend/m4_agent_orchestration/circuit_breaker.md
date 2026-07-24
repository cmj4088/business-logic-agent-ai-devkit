# circuit_breaker.py — 熔断器实现

## 概述
该文件实现了 M4 Agent 编排模块中的熔断器模式（Circuit Breaker）。当 LLM 提供商连续失败达到阈值时，自动"熔断"该提供商，暂停对其的调用，等待一段时间后再尝试恢复。这避免了在服务不可用时持续发送无效请求，保护系统资源。

## 函数/类详细说明

### CircuitState（枚举类）
- **功能**: 定义熔断器的三种状态
- **枚举值**:
  - `CLOSED`（"closed"）: 正常状态，允许调用通过
  - `OPEN`（"open"）: 熔断状态，拒绝所有调用
  - `HALF_OPEN`（"half_open"）: 半开状态，允许尝试一次调用以探测服务是否恢复

### CircuitBreaker（类）
熔断器核心实现，用于追踪 LLM 提供商的失败状态并控制调用流量。

#### __init__()
- **功能**: 初始化熔断器
- **参数**:
  - `max_failures` (int): 触发熔断的连续失败次数阈值，默认 5
  - `retry_after_seconds` (int): 熔断后等待多久再尝试恢复，默认 600 秒（10 分钟）
- **关键逻辑**: 初始化失败计数为 0，状态为 CLOSED，记录相关时间戳

#### record_success()
- **功能**: 记录一次成功调用
- **参数**: 无
- **返回值**: None
- **关键逻辑**: 将 failure_count 重置为 0；如果当前状态是 HALF_OPEN，则恢复到 CLOSED（表示服务已恢复）

#### record_failure()
- **功能**: 记录一次失败调用
- **参数**: 无
- **返回值**: None
- **关键逻辑**: failure_count 递增；如果失败次数达到 max_failures 阈值，将状态切换为 OPEN 并记录熔断时间

#### can_call()
- **功能**: 检查当前是否可以发起调用
- **参数**: 无
- **返回值**: bool — True 表示允许调用，False 表示拒绝
- **关键逻辑**:
  - CLOSED 状态：直接返回 True
  - OPEN 状态：检查从熔断开始到现在是否已超过 retry_after_seconds，若超过则切换到 HALF_OPEN 并返回 True，否则返回 False
  - HALF_OPEN 状态：直接返回 True（允许探测调用）

#### check_and_raise()
- **功能**: 检查熔断状态，若当前处于熔断中则抛出异常
- **参数**:
  - `provider` (str): 提供商名称，用于异常消息
- **返回值**: None（正常时），否则抛出异常
- **关键逻辑**: 调用 can_call()，若返回 False 则抛出 AppException（错误码 LLM_ERROR，状态码 502）

## 依赖关系
- `time`: 标准库，用于时间戳记录和计算
- `enum.Enum`: 标准库，定义熔断器状态枚举
- `shared.errors.ErrorCode`: 项目错误码枚举
- `shared.errors.AppException`: 项目自定义异常类

## 注意事项
- 熔断器是按提供商独立创建的，每个提供商（ollama/anthropic/openai）拥有自己的 CircuitBreaker 实例
- HALF_OPEN 状态下只允许一次调用通过，如果这次调用成功则恢复 CLOSED，失败则重新回到 OPEN
- 熔断不是线程安全的，在当前异步单线程模型下不需要加锁
- retry_after_seconds 的默认值 600 秒（10 分钟）较长，适用于生产环境；开发调试时可适当缩短
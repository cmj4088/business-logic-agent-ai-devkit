# m17_agent_config/hooks/useModelTest.ts — 模型测试 Hook

## 概述
管理 LLM 连接测试的状态和操作，支持测试连接并返回测试结果（成功/失败、延迟、Token 数、模型名称、错误信息）。

## Hook 详细说明

### useModelTest()
- **功能**: 管理 LLM 连接测试
- **返回值**: `UseModelTestReturn`
  - `isTesting` (boolean) — 测试中
  - `testResult` (ModelTestResponse | null) — 测试结果
  - `testError` (string | null) — 测试错误
  - `runTest` (function) — 执行测试
  - `clearResult` (function) — 清除结果
- **关键逻辑**:
  - `runTest` 接收 `{ backend, model?, ollamaUrl?, apiKey? }` 参数
  - 测试失败时构造一个 `success: false` 的 `ModelTestResponse` 对象
  - 测试前自动清除上一次的结果和错误

## 依赖关系
- `react`: useState, useCallback
- `../types`: LLMBackend, ModelTestResponse
- `../api`: testModelConnection

## 注意事项
- 测试失败时也返回 `testResult`（含 `success: false`），而非仅设置 `testError`
- `runTest` 使用 `useCallback` 包裹，依赖数组为空（函数内部使用参数而非闭包变量）
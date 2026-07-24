# test_integration_api.py — 前后端 API 契约集成测试

## 文件位置
`backend/m0_infrastructure/tests/test_integration_api.py`

## 功能概述
验证前端 API 调用与后端端点的一致性，覆盖全部 10 个后端模块共 61 个测试用例。

## 测试结构

### 测试类与覆盖端点

| 测试类 | 模块 | 端点数 | 说明 |
|--------|------|--------|------|
| TestM1Auth | 认证 | 5 | 注册/登录/刷新/用户信息/登出 |
| TestM2Workflow | 工作流 | 12 | 项目 CRUD + 阶段/活动/门禁/暂停/恢复/投票 |
| TestM3Prompt | 提示词 | 5 | 模板列表/详情/更新/预览/渲染 |
| TestM4Agent | Agent 编排 | 5 | 模型列表/测试/API Key 状态/配置/编排 |
| TestM5Artifact | 产出物 | 9 | 类型/创建/列表/详情/更新/版本/删除/附件 |
| TestM6Review | 审核 | 5 | 列表/仪表盘/问题/历史/批量 |
| TestM7Plugin | 插件 | 2 | 已安装列表/可用市场 |
| TestM8Realtime | 实时通信 | 1 | 健康检查 |
| TestM9Usage | 用量追踪 | 8 | 概览/摘要/项目列表/趋势/限制/预算 |
| TestM10Recovery | 异常恢复 | 3 | 状态查询/别名/执行动作 |
| TestSettingsAndData | 设置与数据 | 6 | 设置 CRUD/引导/导出/清除 |

### Fixture 设计

- `setup_env`: 自动设置临时数据库和环境变量
- `app_client`: 创建带数据库初始化的 AsyncClient
- `auth_client`: 自动注册+登录，返回认证客户端
- `project_id`: 创建测试项目，返回项目 ID

### 测试模式
- 使用 `httpx.AsyncClient` + `ASGITransport` 进行异步 HTTP 测试
- 每个测试独立认证，通过 fixture 自动管理
- 测试覆盖正常路径（200）和业务逻辑路径（422）

## 对应前端 API 文件

| 前端模块 | API 文件 | 对应后端端点 |
|----------|---------|-------------|
| M11 | m11_auth_pages/api.ts | /api/auth/* |
| M12 | m12_dashboard/api.ts | /api/dashboard |
| M13 | m13_project_creation/api.ts | /api/projects, /api/workflows/stages |
| M14a | m14a_project_skeleton/api.ts | /api/projects/{id}/* |
| M15 | m15_review_dashboard/api.ts | /api/reviews/* |
| M16 | m16_artifact_editor/api.ts | /api/artifacts/* |
| M17 | m17_agent_config/api.ts | /api/prompts/*, /api/agents/* |
| M18 | m18_usage_settings/api.ts | /api/usage/*, /api/settings |
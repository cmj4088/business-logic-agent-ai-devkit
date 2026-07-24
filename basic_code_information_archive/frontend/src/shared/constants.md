# shared/constants.ts — 全局常量

## 概述
定义 Business Logic Agent 的全局常量，包括 IPD 阶段列表、Agent 角色列表、门禁列表、复杂度活动数、错误码前缀、API 端点、行业选项等。

## 常量详细说明

### IPD_STAGES
- **功能**: IPD 6 阶段数组（lite 模式）
- **值**: `['concept', 'plan', 'develop', 'verify', 'launch', 'lifecycle']`

### AGENT_ROLES
- **功能**: 6 个 Agent 角色数组
- **值**: `['product_manager', 'rd', 'qa', 'marketing', 'manufacturing', 'finance']`

### GATES
- **功能**: 8 个门禁列表
- **值**: `['CDCP', 'PDCP', 'TR3', 'TR4', 'TR5', 'TR6', 'ADCP', 'LDCP']`

### COMPLEXITY_ACTIVITY_COUNTS
- **功能**: 复杂度对应活动数量映射
- **值**: `{ auto: 0, lite: 24, standard: 31, full: 34 }`

### ERROR_PREFIXES
- **功能**: 后端错误码前缀列表
- **值**: `['VALIDATION_', 'NOT_FOUND', 'FORBIDDEN_', 'CONFLICT_', 'LLM_', 'AUTH_', 'INTERNAL_']`

### API_BASE_URL
- **功能**: API 基础路径
- **关键逻辑**: 优先使用环境变量 `VITE_API_BASE_URL`，默认空字符串（同源请求）
- **局域网服务器模式**: `BLA_Server.bat` 构建时设置 `VITE_API_BASE_URL=/api`，使 API 请求发到同源后端
- **本地开发模式**: `.env` 文件中 `VITE_API_BASE_URL=http://localhost:8000` 覆盖默认值

### API_ENDPOINTS
- **功能**: API 端点路径映射
- **值**: `{ PROJECTS, STAGES, TASKS, AGENTS, WORKFLOW }`

### INDUSTRY_OPTIONS
- **功能**: 行业选项列表
- **值**: 消费电子、医疗器械、汽车电子、航空、软件、其他

## 依赖关系
- 导入 `AgentRole`, `ComplexityTier`, `IPDStage` from `./types`

## 注意事项
- `API_BASE_URL` 通过 `import.meta.env` 读取环境变量，仅在 Vite 构建时可用
- `COMPLEXITY_ACTIVITY_COUNTS` 中 `auto` 模式活动数为 0，表示自动判断
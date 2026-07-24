###### 

##### year_2026
#### month_7
### day_24

---

## [2026-07-24] 后端新增生产模式自托管前端静态文件服务
- **需求**: 局域网服务器模式，后端单进程同时提供 API + 前端页面
- **提示词**: （与主日志相同）
- **改动文件**:
  - backend/m0_infrastructure/main.py
- **改动说明**:
  1. 新增 `_mount_frontend_static(app)` 函数：检测 `frontend/dist` 目录是否存在
  2. 存在则挂载为 SPA 静态文件服务，所有未匹配 API 的路径回退到 `index.html`
  3. 新增 `SPAStaticFiles` 类：继承 `StaticFiles`，404 时返回 `index.html` 实现前端路由
  4. 在 `create_app()` 末尾调用（确保 API 路由优先匹配）
- **架构变更**: 后端新增自托管模式，生产环境无需 Vite 代理服务器

---

## 对应后端的位置，包括链接和行数
- [Click here to open main.py (backend)](C:/Users/32277/Desktop/Business logic agents/backend/m0_infrastructure/main.py)
    - 133-168（_mount_frontend_static 函数 + SPAStaticFiles 类）
    - 127-131（create_app 末尾调用挂载）

## 对应在 basic_code_information_archive 的文档位置
- [Click here to open main.md](C:/Users/32277/Desktop/Business logic agents/basic_code_information_archive/backend/m0_infrastructure/main.md)
    - 6-10（SPAStaticFiles 和 _mount_frontend_static 说明）

---

### day_15
- **需求**: 主动扫描代码中的 TODO 和弃用警告进行清理
- **提示词**: "进行你的工作"（主动改进）
- **改动文件**: 
  - backend/m8_realtime_communication/router.py（SSE 轮询替换 TODO）
  - shared/config.py（class Config → model_config）
  - basic_code_information_archive/backend/m8_realtime_communication/router.md（同步更新）
- **改动说明**:
  1. M8 SSE `sse_messages()` 端点：将 `# TODO: 实际项目中查询数据库` 占位符替换为真实的 messages 表轮询逻辑（每 3 秒增量查询 round_id 的消息，推送 SSE event: message 事件）
  2. shared/config.py：将 Pydantic v1 风格的 `class Config:` 替换为 v2 的 `model_config = SettingsConfigDict(...)`，消除 PydanticDeprecatedSince20 告警
  3. basic_code_information_archive 同步更新 M8 router.md（新格式 + 反应 SSE 实现）

---

## 对应后端的位置，包括链接和行数
- [Click here to open router.py (M8)](C:/Users/32277/Desktop/IPDagents/backend/m8_realtime_communication/router.py)
    - 241-271（SSE event_stream 重写：3 秒轮询 × 30 秒心跳，按 created_at 增量查询 messages 表）
- [Click here to open config.py (shared)](C:/Users/32277/Desktop/IPDagents/shared/config.py)
    - 12（新增 SettingsConfigDict 导入），73-75（class Config → model_config）

## 对应在 basic_code_information_archive 的文档位置
- [Click here to open M8 router.md](C:/Users/32277/Desktop/IPDagents/basic_code_information_archive/backend/m8_realtime_communication/router.md)
    - 全部（重写为新格式 + 同步 SSE 实现说明）

---

### day_9
    - 2026-7-9-00:30（项目初始化完成）
    - 后端 10 个模块全部完成，98 个测试通过
    - M0: 基础设施、M1: 认证安全、M2: 工作流引擎、M3: 提示词系统、M4: Agent编排、M5: 产出物管理、M6: 评审系统、M7: 插件系统、M8: 实时通信、M9: 用量追踪、M10: 异常恢复
## 对应后端的位置：
    - [Click here to open main.py](C:/Users/32277/Desktop/IPDagents/backend/m0_infrastructure/main.py)
    - [Click here to open database.py](C:/Users/32277/Desktop/IPDagents/backend/m0_infrastructure/database.py)
    - [Click here to open config.py](C:/Users/32277/Desktop/IPDagents/backend/shared/config.py)
## 对应在basic_code_information_archive的文档位置：
    - 待补充

### day_10
    - 2026-7-10-11:50（接入 DeepSeek 外部 AI API）
    - LLMRouter 新增 DeepSeek provider 支持（OpenAI 兼容格式）
    - LLMRouter 新增 _get_api_key 方法：优先从数据库 secrets 表读取加密 Key，其次从环境变量
    - LLMRouter.__init__ 接受 db 和 user_id 参数，用于查询用户 API Key
    - Orchestrator.__init__ 接受 user_id 参数，传递给 LLMRouter
    - M4 router：新增 POST /api/agents/api-keys 端点保存 Key 到 secrets 表
    - M4 router：test_model 和 test_model_alias 传入 db 和 user_id
    - M4 router：/api-keys/status 和 /models 加入 deepseek
    - M2 router：perform_activity_action 传入 user_id 给 Orchestrator
    - 默认 provider 从 ollama 改为 deepseek，max_tokens 从 32000 改为 8192
## 对应后端的位置：
    - [Click here to open llm_router.py](C:/Users/32277/Desktop/IPDagents/backend/m4_agent_orchestration/llm_router.py)
    - [Click here to open orchestrator.py](C:/Users/32277/Desktop/IPDagents/backend/m4_agent_orchestration/orchestrator.py)
    - [Click here to open m4 router.py](C:/Users/32277/Desktop/IPDagents/backend/m4_agent_orchestration/router.py)
    - [Click here to open m2 router.py](C:/Users/32277/Desktop/IPDagents/backend/m2_workflow_engine/router.py)
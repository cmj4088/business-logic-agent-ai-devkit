###### 

##### year_2026
#### month_7
### day_24

---

## [2026-07-24] 前端支持局域网服务器模式（API_BASE_URL 改为同源 + Vite host: true）
- **需求**: 局域网服务器模式，前端可从其他电脑访问并能正常调用 API
- **提示词**: （与主日志相同）
- **改动文件**:
  - frontend/src/shared/constants.ts
  - frontend/vite.config.ts
- **改动说明**:
  1. constants.ts：`API_BASE_URL` 默认从 `http://localhost:8000` 改为空字符串。空字符串 = 同源请求，在 Vite 代理模式下转发 `/api` 到后端，在生产模式下直接请求同源后端。本地开发时 `.env` 中的 `VITE_API_BASE_URL=http://localhost:8000` 仍然生效
  2. vite.config.ts：新增 `server.host: true`，使 Vite 开发服务器监听 `0.0.0.0`，局域网内其他设备可通过 `http://本机IP:5173` 访问开发版前端

---

## 对应前端的位置，包括链接和行数
- [Click here to open constants.ts](C:/Users/32277/Desktop/Business logic agents/frontend/src/shared/constants.ts)
    - 36-39（API_BASE_URL 默认值改为空字符串）
- [Click here to open vite.config.ts](C:/Users/32277/Desktop/Business logic agents/frontend/vite.config.ts)
    - 14（新增 server.host: true）

## 对应在 basic_code_information_archive 的文档位置
- [Click here to open constants.md](C:/Users/32277/Desktop/Business logic agents/basic_code_information_archive/frontend/src/shared/constants.md)
    - 30-32（API_BASE_URL 说明更新）
- [Click here to open vite.config.md](C:/Users/32277/Desktop/Business logic agents/basic_code_information_archive/frontend/vite.config.md)
    - 20-21（server.host 新增）
    - 43-44（host: true + 生产模式说明新增）

---

### day_10
    - 2026-7-10-11:50（接入 DeepSeek + AgentChat 微信风格改造）
    - 前端 8 个模块中 4 个已审核通过（M11 认证、M12 Dashboard、M13 项目创建、M14a 项目骨架）
    - M16 产出物编辑器审核中，M15/M17 因 API 503 错误待重试，M14b/M18/E0 待启动
## 对应前端的位置：
    - [Click here to open App.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/App.tsx)
    - [Click here to open api-client.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/shared/api-client.ts)
    - [Click here to open types.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/shared/types.ts)
## 对应在basic_code_information_archive的文档位置：
    - 待补充

### day_10
    - 2026-7-10-11:50（接入 DeepSeek + AgentChat 微信风格改造）
    - M17 types.ts：LLMBackend 类型新增 'deepseek'，AgentConfig 新增 deepseekApiKey 字段
    - M17 DEFAULT_AGENT_CONFIG：默认后端改为 deepseek，默认模型 deepseek-chat，maxTokens 8192
    - M17 LLM_BACKEND_OPTIONS：DeepSeek 作为第一选项（推荐）
    - M17 ApiKeyConfig.tsx：新增 DeepSeek API Key 输入框和测试按钮
    - M17 DataExportNotice.tsx：新增 deepseek 数据出境告知（目的地中国）
    - M17 useAgentConfig.ts：新增 setDeepseekApiKey 方法
    - M17 index.tsx：传递 deepseekApiKey 和 onDeepseekKeyChange 给 ApiKeyConfig
    - M17 ApiKeyConfig 测试：补充 deepseekApiKey 和 onDeepseekKeyChange props
    - M14a AgentChat.tsx：重写为微信/QQ 风格（圆圈头像 + 气泡消息 + 群组头像）
## 对应前端的位置：
    - [Click here to open AgentChat.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m14a_project_skeleton/components/AgentChat.tsx)
    - [Click here to open ApiKeyConfig.tsx](C:/Users/32277/Desktop/IPDagents/frontend/src/m17_agent_config/components/ApiKeyConfig.tsx)
    - [Click here to open types.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/m17_agent_config/types.ts)
    - [Click here to open useAgentConfig.ts](C:/Users/32277/Desktop/IPDagents/frontend/src/m17_agent_config/hooks/useAgentConfig.ts)
# M8: 实时通信 — CLAUDE.md

> **模块编号**：M8
> **模块名称**：实时通信
> **负责 Agent**：全栈开发 C
> **开发周期**：Week 4-6
> **上游依赖**：M0（基础设施）、M1（认证安全）、M4（Agent 编排）
> **下游被依赖**：M12（Dashboard）、M14a（项目骨架）、M14b（项目联调）

---

## 职责范围

M8 负责前后端实时数据推送：
1. **WebSocket 连接管理**：5 个 WebSocket 通道
2. **Agent 流式输出推送**：Agent 生成内容实时推送到前端
3. **阶段状态变更推送**：阶段推进时通知前端
4. **侧边栏小组件推送**：供应链/认证/竞品/预算状态实时更新
5. **通知推送**：门禁就绪、审核请求、预算偏差等
6. **SSE 通道**：消息流式传输（作为 WebSocket 的降级方案）

---

## 输入依赖

| 依赖 | 来源 | 用途 |
|------|------|------|
| FastAPI app 实例 | M0 | 注册 WebSocket 路由 |
| 认证中间件 | M1 | WebSocket 连接认证（token 在 query param） |
| Agent 编排 | M4 | 接收 Agent 流式输出事件 |

---

## 输出接口

| 接口 | 类型 | 说明 |
|------|------|------|
| `/ws/agent/{project_id}` | WebSocket | Agent 流式输出通道 |
| `/ws/stage/{project_id}` | WebSocket | 阶段状态变更通道 |
| `/ws/widgets/{project_id}` | WebSocket | 侧边栏小组件状态通道 |
| `/ws/notifications` | WebSocket | 全局通知通道 |
| `/ws/messages/{round_id}` | WebSocket | 消息流式通道 |
| `/api/sse/messages/{round_id}` | SSE | 消息流式传输（降级方案） |
| `/api/dashboard` | GET | Dashboard 聚合数据（用户、待处理事项、项目列表、通知摘要） |

> **注意**：`/api/dashboard` 聚合端点虽归属 M8，但其数据来自 M2（项目）、M6（审核）、M9（用量）等多模块聚合，M12（Dashboard 前端）是唯一消费者。

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `router.py` | WebSocket 路由注册 |
| `connection_manager.py` | WebSocket 连接管理器（连接池、心跳、断线重连） |
| `agent_stream.py` | Agent 流式输出处理 |
| `stage_broadcaster.py` | 阶段状态广播 |
| `widget_pusher.py` | 小组件状态推送 |
| `notification_pusher.py` | 通知推送 |
| `sse_handler.py` | SSE 降级处理 |
| `models.py` | 消息模型 |

---

## WebSocket 消息格式

### 客户端 → 服务端
```json
{
  "type": "subscribe",
  "channel": "agent_output",
  "project_id": "proj_xxx"
}
```

### 服务端 → 客户端
```json
{
  "type": "agent_token | stage_update | widget_update | notification | error | pong",
  "data": { ... }
}
```

### 完整消息类型枚举

| 类型 | 方向 | 说明 |
|------|------|------|
| `subscribe` | 客户端→服务端 | 订阅通道 |
| `unsubscribe` | 客户端→服务端 | 取消订阅 |
| `agent_token` | 服务端→客户端 | Agent 流式 token |
| `stage_update` | 服务端→客户端 | 阶段状态变更 |
| `widget_update` | 服务端→客户端 | 小组件状态更新 |
| `notification` | 服务端→客户端 | 系统通知 |
| `error` | 服务端→客户端 | 错误消息 |
| `ping` | 双向 | 心跳检测 |
| `pong` | 双向 | 心跳响应 |
```

---

## 5 个 WebSocket 通道

| 通道 | 推送内容 | 触发时机 |
|------|---------|---------|
| agent | Agent 生成 token 流 | Agent 编排执行中 |
| stage | 阶段推进/回退/完成 | 工作流引擎状态变更 |
| widgets | 供应链/认证/竞品/预算状态 | 后台任务更新 |
| notifications | 门禁就绪/审核请求/预算偏差 | 事件触发 |
| messages | 单条消息流式传输 | 消息生成中 |

---

## 连接管理

- 心跳：每 30 秒 ping/pong
- 断线重连：指数退避（1s, 2s, 4s, 8s, 最大 30s）
- 最大连接数：10（MVP 单用户足够）
- Token 认证：WebSocket 连接时 query param 携带 token

---

## 技能集成

### 技能产出物的实时推送

M8 负责将 Skill 生成的产出物状态实时推送到前端，确保用户能即时看到技能执行结果：

| 推送场景 | 触发事件 | WebSocket 通道 | 推送内容 |
|---------|---------|---------------|---------|
| Skill 开始执行 | M4 编排器触发 Skill 调用 | `agent` | `{type: "skill_start", skill_name, agent_role}` |
| Skill 执行进度 | Skill 生成过程中 | `agent` | `{type: "skill_progress", skill_name, progress: 0-100}` |
| Skill 产出物就绪 | Skill 完成生成 | `agent` | `{type: "skill_complete", skill_name, artifact_id, artifact_type}` |
| Skill 产出物更新 | 产出物版本更新 | `notifications` | `{type: "artifact_updated", artifact_id, version}` |
| Skill 执行失败 | Skill 调用异常 | `agent` | `{type: "skill_error", skill_name, error_message}` |

### 与 M5 产出物管理的联动

当 Skill 生成产出物后，M8 需要从 M5 获取产出物状态并推送：

```
Skill 完成生成
  → M5 创建/更新产出物记录
  → M8 接收到产出物变更事件
  → M8 通过 agent 通道推送 "skill_complete" 消息
  → 前端 M14b/M16 接收消息并刷新产出物列表
```

### 通知推送扩展

在原有通知类型基础上，增加 Skill 相关通知：

| 通知类型 | 推送时机 | 通知内容示例 |
|---------|---------|------------|
| `skill_complete` | Skill 生成完成 | "📄 MRD 文档已由产品经理 Agent 生成完成" |
| `skill_artifact_ready` | 技能产出物可查看 | "📊 BOM 成本表已生成，可前往产出物页面查看" |
| `skill_error` | Skill 执行失败 | "⚠️ 数据分析报告生成失败，请检查数据源后重试" |

## 完成标准

- [ ] 5 个 WebSocket 通道全部可用
- [ ] Agent 流式输出正确推送到前端
- [ ] 阶段状态变更前端实时更新
- [ ] 小组件状态正确推送
- [ ] 断线重连正常工作
- [ ] SSE 降级方案可用
- [ ] 心跳机制正常（30 秒）
- [ ] 通知推送正确（门禁就绪、审核请求、预算偏差）
- [ ] **Skill 执行进度实时推送（skill_start → skill_progress → skill_complete）**
- [ ] **Skill 产出物就绪时自动通知前端刷新**
- [ ] **Skill 执行失败时推送错误通知**

---

## 禁止事项

1. **禁止 WebSocket 连接无认证**（token 必须在连接时验证）
2. **禁止推送敏感数据到前端**（推送前过滤身份证号、手机号、邮箱）
3. **禁止无心跳的 WebSocket 连接**（必须有 30 秒心跳）
4. **禁止广播其他用户的数据**（MVP 单用户，但预留隔离）
5. **禁止在 WebSocket 消息中传输大文件**（>1MB 使用 HTTP 文件下载）
6. **禁止无限重连**（最多 5 次，之后显示"连接失败"）

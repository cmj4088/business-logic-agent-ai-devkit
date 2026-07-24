# Agent: 前端开发 D — 任务分配

> **角色**：前端开发 D
> **负责模块**：M11（认证页面）、M12（Dashboard）、M13（项目创建向导）、M14a（项目详情骨架）
> **开发周期**：Week 1-5
> **技能使用**：无（前端展示层，数据由后端 Skill 生成后展示）

---

## 一、M11 — 认证页面

### 任务清单
- [ ] LoginPage（登录表单、Token 存储、错误提示）
- [ ] RegisterPage（注册表单、密码强度校验、邮箱格式校验）
- [ ] ProtectedRoute（路由守卫、未登录重定向）
- [ ] AuthContext（全局认证状态 Provider）

### 输入依赖
| 依赖 | 来源 |
|------|------|
| API 客户端 | shared/api-client.ts |
| 类型定义 | shared/types.ts |

### 输出接口
| 输出 | 类型 | 说明 |
|------|------|------|
| `/login` | Route | 登录页 |
| `/register` | Route | 注册页 |
| AuthContext | Context | 全局认证状态 |

### 技能使用
- 无

---

## 二、M12 — Dashboard

### 任务清单
- [ ] WelcomeBanner（欢迎语 + 快速入口）
- [ ] PendingTasks（待处理任务列表，来自 WebSocket 推送）
- [ ] AutoCompletedTasks（自动完成任务列表）
- [ ] ProjectList（项目列表，可搜索/筛选）
- [ ] 数据可视化卡片（项目总数、进行中、已完成）
- [ ] WebSocket 降级轮询（Dashboard 实时数据）

### 输入依赖
| 依赖 | 来源 |
|------|------|
| API 客户端 | shared/api-client.ts |
| AuthContext | M11 |
| 类型定义 | shared/types.ts |

### 输出接口
| 输出 | 类型 | 说明 |
|------|------|------|
| `/` | Route | Dashboard 首页 |

### 技能使用
- 前端仅展示数据，数据分析由后端 M9 通过 `ipd-data-analysis` 完成
- Token 趋势图、项目统计卡片的数据来源于后端 M9 聚合

---

## 三、M13 — 项目创建向导

### 任务清单
- [ ] QuickStartForm（5 必填项：项目名称/行业/产品类型/团队规模/预算）
- [ ] IndustrySelector（行业选择器，含合规提示）
- [ ] ComplexityPreview（复杂度预览：lite/standard/full）
- [ ] ComplianceHints（行业合规提示）
- [ ] 创建成功后自动跳转到项目详情页

### 输入依赖
| 依赖 | 来源 |
|------|------|
| API 客户端 | shared/api-client.ts |
| AuthContext | M11 |
| 类型定义 | shared/types.ts |

### 输出接口
| 输出 | 类型 | 说明 |
|------|------|------|
| `/projects/new` | Route | 项目创建页 |

### 技能使用
- 无

---

## 四、M14a — 项目详情骨架

### 任务清单
- [ ] 项目详情页布局（左侧时间线 + 中间主内容区 + 右侧面板）
- [ ] StageTimeline（6 阶段时间线，当前阶段高亮）
- [ ] ActivityList（当前阶段活动列表，已裁剪）
- [ ] AgentChat 基础组件（Agent 对话展示区骨架）
- [ ] 门禁状态栏（当前阶段门禁通过状态）
- [ ] 侧边栏面板容器（预算/供应链/认证/竞品小组件）
- [ ] ProjectHeader（项目名称、状态、进度条、操作按钮）
- [ ] WebSocket 连接（useProjectWS）

### 输入依赖
| 依赖 | 来源 |
|------|------|
| API 客户端 | shared/api-client.ts |
| AuthContext | M11 |
| 类型定义 | shared/types.ts |

### 输出接口
| 输出 | 类型 | 说明 |
|------|------|------|
| `/projects/:id` | Route | 项目详情页 |

### 技能使用
- 前端骨架组件，展示由后端 M5 通过 Skill 生成的数据
- 产出物列表区域预留展示位置，由 M16 填充具体内容
- 侧边栏小组件数据由后端 M2 widget 接口提供
- Agent 对话区域由 M14b 联调填充真实数据

---

## 五、全局依赖关系

```
M11（认证页面）→ AuthContext 提供给所有模块
  ├─→ M12（Dashboard）→ 依赖 M8/M9 数据
  ├─→ M13（项目创建向导）→ 依赖 M2 接口
  └─→ M14a（项目详情骨架）→ 依赖 M2/M8 接口
```

## 六、关键文件

| 模块 | 文件 | 说明 |
|------|------|------|
| M11 | `m11_auth_pages/LoginPage.tsx` | 登录页 |
| M11 | `m11_auth_pages/RegisterPage.tsx` | 注册页 |
| M11 | `m11_auth_pages/ProtectedRoute.tsx` | 路由守卫 |
| M11 | `m11_auth_pages/AuthContext.tsx` | 认证状态 |
| M12 | `m12_dashboard/WelcomeBanner.tsx` | 欢迎语 |
| M12 | `m12_dashboard/PendingTasks.tsx` | 待处理任务 |
| M12 | `m12_dashboard/ProjectList.tsx` | 项目列表 |
| M13 | `m13_project_creation/QuickStartForm.tsx` | 快速创建表单 |
| M13 | `m13_project_creation/IndustrySelector.tsx` | 行业选择器 |
| M13 | `m13_project_creation/ComplexityPreview.tsx` | 复杂度预览 |
| M14a | `m14a_project_skeleton/StageTimeline.tsx` | 阶段时间线 |
| M14a | `m14a_project_skeleton/ActivityList.tsx` | 活动列表 |
| M14a | `m14a_project_skeleton/AgentChat.tsx` | Agent 对话组件 |
| M14a | `m14a_project_skeleton/SidebarPanel.tsx` | 侧边栏面板 |
| M14a | `m14a_project_skeleton/ProjectHeader.tsx` | 项目头部 |

## 七、完成标准

- [ ] M11 全部完成（登录/注册/路由守卫/AuthContext）
- [ ] M12 全部完成（Dashboard 完整页面，含 WebSocket 降级轮询）
- [ ] M13 全部完成（项目创建向导完整流程）
- [ ] M14a 全部完成（项目详情骨架布局 + 所有组件基础版）
- [ ] 所有页面路由正确，无白屏
- [ ] 所有组件适配 Ant Design 主题
- [ ] TypeScript 类型完整，无 any
- [ ] 所有 API 调用有错误处理

## 八、参考文档

- `docx/architecture-v5.md` — 系统架构设计
- `docx/api-design.md` — API 端点设计
- `MVPtext/CLAUDE.md` — 主开发规则
- `MVPtext/frontend/m12-dashboard/CLAUDE.md` — M12 模块详情
- `MVPtext/frontend/m13-project-creation/CLAUDE.md` — M13 模块详情
- `MVPtext/frontend/m14a-project-skeleton/CLAUDE.md` — M14a 模块详情
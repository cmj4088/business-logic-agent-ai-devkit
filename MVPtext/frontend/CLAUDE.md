# 前端公共规则 — CLAUDE.md

> **适用范围**：`MVPtext/frontend/` 下所有模块
> **参考文档**：`docs/mvp-guide-v2.md`、`docs/architecture-v5.md`

---

## 技术栈

- **语言**：TypeScript 5.x（strict: true，禁止 any）
- **框架**：React 18 + React Router v6
- **构建**：Vite 5
- **样式**：Tailwind CSS 3.x
- **状态管理**：React Context + useReducer（不引入 Redux/Zustand）
- **HTTP 客户端**：axios
- **WebSocket**：原生 WebSocket API
- **Markdown 编辑**：Toast UI Editor（M16 使用）
- **图表**：Chart.js（M18 使用）
- **测试**：Vitest + React Testing Library

---

## 目录约定

每个模块目录结构：
```
frontend/mXX-模块名/
├── index.tsx           # 页面入口组件
├── components/         # 模块专属组件
│   └── ComponentName.tsx
├── hooks/              # 模块专属 hooks
│   └── useXxx.ts
├── types.ts            # 模块专属类型
├── api.ts              # 模块 API 调用
├── __tests__/
│   └── *.test.tsx
└── CLAUDE.md
```

---

## 组件规则

### 命名
- 组件文件：PascalCase（`AgentChat.tsx`）
- Hook 文件：camelCase + use 前缀（`useAgentStream.ts`）
- 工具函数：camelCase（`formatDate.ts`）

### 组件结构顺序
```tsx
// 1. imports
// 2. types/interfaces
// 3. component definition
// 4. hooks
// 5. event handlers
// 6. render
// 7. exports
```

### 状态管理
1. 页面级状态用 Context
2. 组件局部状态用 useState/useReducer
3. 服务端状态用自定义 hook 封装（含 loading/error/data 三态）
4. **不引入 Redux、Zustand、MobX 等状态管理库**

---

## API 调用规则

### 统一封装
所有 API 调用通过 `shared/api-client.ts`（前端版）：
```typescript
// 正确
import { api } from '@/shared/api-client';
const projects = await api.get('/api/projects');

// 禁止
const res = await fetch('http://localhost:8000/api/projects');
```

### 错误处理
每个 API 调用必须处理三种状态：
```typescript
const { data, error, isLoading } = useApi('/api/projects');
// 或
try {
  const data = await api.get('/api/projects');
} catch (error) {
  // 根据 error.code 显示对应错误提示
}
```

---

## UI 规则

### 设计原则
1. **渐进式信息披露**：先摘要，再详情
2. **行动导向**：告诉用户"你能做什么"
3. **状态可视化**：绿/黄/红三色系统
4. **中文界面**：所有用户可见文本使用中文
5. **桌面原生体验**：响应式但优先桌面布局（最小宽度 1024px）

### 合规组件（必须使用 — 位于 `src/shared/components/`，全项目共享）

以下组件在 `src/shared/components/` 中统一定义，各模块通过 `@/shared/components/` 导入，**禁止各模块独立实现**：

- **AIBadge**：所有 Agent 生成内容顶部必须显示（`src/shared/components/AIBadge.tsx`）
- **DataExportNotice**：用户配置云端 API 时弹出数据出境告知（`src/shared/components/DataExportNotice.tsx`）
- **RecoveryPanel**：Agent 异常时显示可操作的恢复面板（`src/shared/components/RecoveryPanel.tsx`）

### Vite 路径别名
```typescript
// vite.config.ts 必须配置
resolve: {
  alias: {
    '@': '/src',
    '@shared': '/src/shared',
  }
}
```

### 禁止事项
1. **禁止直接操作 localStorage 存储敏感信息**（Token 由 Electron secureStore 管理）
2. **禁止在前端拼接 SQL 或直接访问数据库**
3. **禁止在组件中硬编码 API 地址**
4. **禁止使用 any 类型**
5. **禁止引入 jQuery、Bootstrap 等老旧库**
6. **禁止在渲染进程中 require Node.js 模块**（contextIsolation: true）

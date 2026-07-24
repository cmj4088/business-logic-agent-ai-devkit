# M11: 认证页面 — CLAUDE.md

> **模块编号**：M11
> **模块名称**：认证页面（前端）
> **负责 Agent**：前端开发 D
> **开发周期**：Week 1-2
> **上游依赖**：M1（认证安全后端）
> **下游被依赖**：M12, M13, M14a, M14b, M15, M16, M17, M18（所有前端页面，提供登录状态和认证上下文）

---

## 职责范围

M11 负责用户认证相关的前端页面和逻辑：
1. **登录页**：邮箱 + 密码登录表单
2. **注册页**：邮箱 + 密码 + 确认密码注册表单
3. **隐私政策弹窗**：首次使用必须同意隐私政策（合规必须）
4. **用户协议弹窗**：首次使用必须同意用户协议（合规必须）
5. **AuthContext**：全局认证状态管理（登录/登出/Token 刷新）
6. **Token 管理**：Session Token 存储（通过 Electron secureStore）
7. **路由守卫**：未登录用户重定向到登录页

---

## 输入依赖

| 依赖 | 来源 | 用途 |
|------|------|------|
| API 客户端 | shared/api-client.ts | 调用认证 API |
| Electron secureStore | electron preload | Token 安全存储 |
| 类型定义 | shared/types.ts | 用户类型 |

---

## 输出接口

| 输出 | 类型 | 说明 |
|------|------|------|
| `AuthProvider` | React Context | 全局认证上下文 |
| `useAuth()` | Hook | 获取认证状态和方法 |
| `/login` | Route | 登录页 |
| `/register` | Route | 注册页 |

---

## 关键文件

| 文件 | 说明 |
|------|------|
| `index.tsx` | 认证模块入口（路由配置） |
| `components/LoginPage.tsx` | 登录页面 |
| `components/RegisterPage.tsx` | 注册页面 |
| `components/PrivacyPolicyModal.tsx` | 隐私政策弹窗（合规必须） |
| `components/TermsOfServiceModal.tsx` | 用户协议弹窗（合规必须） |
| `contexts/AuthContext.tsx` | 认证上下文（login/logout/refreshToken） |
| `hooks/useAuth.ts` | 认证 Hook |
| `hooks/useTokenRefresh.ts` | Token 自动刷新 Hook（到期前 5 分钟刷新） |
| `api.ts` | 认证 API 调用 |
| `types.ts` | 认证相关类型 |

---

## 页面设计要点

### 登录页
- 邮箱输入框 + 密码输入框 + "登录"按钮
- "没有账号？注册"链接
- 登录失败显示错误提示（密码错误/账号不存在/锁定中）
- 登录成功后跳转到 Dashboard（M12）

### 注册页
- 邮箱 + 密码 + 确认密码
- 密码强度指示器（≥8 位，含数字+字母）
- "注册"按钮 + "已有账号？登录"链接
- 注册成功后自动登录

### 隐私政策/用户协议弹窗
- 首次登录后弹出，必须点击"同意"才能使用
- 不同意则退出应用
- 同意状态持久化存储

---

## 路由守卫

```typescript
// 未登录用户访问任何页面 → 重定向到 /login
// 已登录用户访问 /login 或 /register → 重定向到 /dashboard
<ProtectedRoute>
  <Outlet />
</ProtectedRoute>
```

---

## 完成标准

- [ ] 登录/注册功能可用
- [ ] Token 自动刷新正常（到期前 5 分钟刷新）
- [ ] 隐私政策弹窗显示并需要用户同意
- [ ] 用户协议弹窗显示并需要用户同意
- [ ] 路由守卫正确拦截未登录用户
- [ ] 密码强度校验正常
- [ ] 登录失败错误提示准确

---

## 禁止事项

1. **禁止在前端 localStorage 存储 Token**（必须通过 Electron secureStore）
2. **禁止明文传输密码**（HTTPS + bcrypt 后端哈希）
3. **禁止跳过隐私政策/用户协议弹窗**
4. **禁止登录失败提示过于具体**（统一"邮箱或密码错误"，不区分哪个错误）
5. **禁止 Token 刷新失败时静默失败**（必须提示用户重新登录）
6. **禁止注册无密码强度校验**

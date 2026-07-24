# m11_auth_pages/components/LoginPage.tsx — 登录页面组件

## 概述
用户登录页面，提供邮箱和密码输入表单。登录成功后自动跳转到 Dashboard 页面。包含表单验证、错误提示和加载状态。

## 组件详细说明

### LoginPage (默认导出)
- **功能**: 登录页面 UI 和交互逻辑
- **状态管理**: 
  - `email` (string) — 邮箱输入值
  - `password` (string) — 密码输入值
  - `error` (string) — 错误提示信息
  - `isSubmitting` (boolean) — 提交中状态
- **关键逻辑**:
  - `handleSubmit`: 表单提交处理，验证非空后调用 `login`，成功后跳转到 `/dashboard`
  - 错误信息从 `useAuth` 的 `login` 方法抛出的异常中提取
- **UI 结构**: 居中布局，卡片式表单，包含邮箱输入框、密码输入框、登录按钮、注册链接

## 依赖关系
- `react`: useState, FormEvent
- `react-router-dom`: Link, useNavigate
- `../contexts/AuthContext`: useAuth

## 注意事项
- 使用 `e.preventDefault()` 阻止表单默认提交行为
- 登录过程中按钮显示"登录中..."并禁用
- 底部提供"没有账号？注册"链接
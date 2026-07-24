# m11_auth_pages/components/RegisterPage.tsx — 注册页面组件

## 概述
用户注册页面，提供邮箱、显示名称、密码、确认密码输入表单。包含密码强度指示器和表单验证。注册成功后自动跳转到 Dashboard 页面。

## 组件/函数详细说明

### PasswordStrength (类型)
- **功能**: 密码强度等级
- **可选值**: `'empty'` | `'weak'` | `'medium'` | `'strong'`

### getPasswordStrength(password)
- **功能**: 计算密码强度
- **参数**: `password` (string)
- **返回值**: `PasswordStrength`
- **关键逻辑**: 
  - `empty`: 长度为 0
  - `weak`: 不满足 medium 条件
  - `medium`: 至少 8 位 + 包含数字和字母
  - `strong`: 至少 8 位 + 包含数字和字母 + 特殊字符

### strengthConfig
- **功能**: 密码强度对应的 UI 配置（标签、颜色、进度条宽度）
- **值**: 映射 `PasswordStrength` 到 `{ label, color, width }`

### RegisterPage (默认导出)
- **功能**: 注册页面 UI 和交互逻辑
- **状态管理**: `email`, `password`, `confirmPassword`, `displayName`, `error`, `isSubmitting`
- **关键逻辑**:
  - `handleSubmit`: 验证密码长度 >= 8，包含数字和字母，两次密码一致
  - 密码强度通过 `useMemo` 实时计算，避免重复运算
  - 密码输入框下方显示强度指示器（进度条 + 文字）
- **UI 结构**: 居中布局，卡片式表单，包含邮箱、显示名称、密码（含强度指示器）、确认密码、注册按钮、登录链接

## 依赖关系
- `react`: useState, useMemo, FormEvent
- `react-router-dom`: Link, useNavigate
- `../contexts/AuthContext`: useAuth

## 注意事项
- 显示名称为可选字段
- 密码强度指示器仅在密码非空时显示
- 强度为 `weak` 时额外提示要求
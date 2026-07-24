/** M11 认证模块 — 统一入口 */

export { AuthProvider, useAuth } from './contexts/AuthContext';
export { ProtectedRoute } from './components/ProtectedRoute';
export { default as LoginPage } from './components/LoginPage';
export { default as RegisterPage } from './components/RegisterPage';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { AuthProvider, ProtectedRoute } from '@/m11_auth_pages';
import { LoginPage } from '@/m11_auth_pages';
import { RegisterPage } from '@/m11_auth_pages';
import ProjectCreationPage from '@/m13_project_creation';
import ProjectDetailPage from '@/m14a_project_skeleton';
import DashboardPage from '@/m12_dashboard';
import SettingsPage from '@/m18_usage_settings';
import ReviewDashboardPage, { ReviewDetail } from '@/m15_review_dashboard';
import { ArtifactListPage, ArtifactDetailPage } from '@/m16_artifact_editor';
import { DisclaimerBanner } from '@/shared/components/DisclaimerBanner';
import { AppLayout } from '@/shared/components/AppLayout';
import { ArtifactsRedirect } from '@/shared/components/ArtifactsRedirect';
import PluginManagementPage from '@/m19_plugin_management';
import TemplateEditorPage from '@/m20_template_editor';
import TemplateListPage from '@/m20_template_editor/TemplateList';

const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorBgContainer: '#242424',
    colorBgElevated: '#1a1a1a',
    colorBgLayout: '#111111',
    colorBorder: '#333333',
    colorPrimary: '#00d4ff',
    colorText: '#e2e8f0',
    colorTextSecondary: '#94a3b8',
    borderRadius: 8,
  },
};

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ConfigProvider theme={darkTheme}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/projects/new" element={<ProjectCreationPage />} />
                    <Route path="/projects/:id" element={<ProjectDetailPage />} />
                    <Route path="/reviews" element={<ReviewDashboardPage />} />
                    <Route path="/reviews/:reviewId" element={<ReviewDetail />} />
                    <Route path="/artifacts" element={<ArtifactsRedirect />} />
                    <Route path="/projects/:id/artifacts" element={<ArtifactListPage />} />
                    <Route path="/projects/:id/artifacts/:artifactId" element={<ArtifactDetailPage />} />
                    <Route path="/settings/*" element={<SettingsPage />} />
                    <Route path="/plugins" element={<PluginManagementPage />} />
                    <Route path="/templates" element={<TemplateListPage />} />
                    <Route path="/templates/new" element={<TemplateEditorPage />} />
                    <Route path="/templates/:templateId/edit" element={<TemplateEditorPage />} />
                  </Route>
                </Route>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
            <DisclaimerBanner position="bottom" />
          </div>
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
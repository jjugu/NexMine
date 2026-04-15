import './i18n';
import { lazy, Suspense, Component, useMemo, useEffect } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, CircularProgress, Box, Alert, Typography, Button } from '@mui/material';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/ko';
import { createAppTheme } from './theme/theme';
import { useThemeStore } from './stores/themeStore';
import axiosInstance from './api/axiosInstance';
import type { AppSettingsResponse } from './api/generated/model';

// Google Client ID: prefer env var, fallback to DB setting loaded in AppContent
import AuthLayout from './components/layout/AuthLayout';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminRoute from './components/layout/AdminRoute';

const LoginPage = lazy(() => import('./features/auth/components/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/components/RegisterPage'));
const DashboardPage = lazy(() => import('./features/dashboard/components/DashboardPage'));
const ProjectListPage = lazy(() => import('./features/projects/components/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('./features/projects/components/ProjectDetailPage'));
const IssueListPage = lazy(() => import('./features/issues/components/IssueListPage'));
const IssueCreatePage = lazy(() => import('./features/issues/components/IssueCreatePage'));
const IssueDetailPage = lazy(() => import('./features/issues/components/IssueDetailPage'));
const VersionListPage = lazy(() => import('./features/issues/components/VersionListPage'));
const ProjectSettingsPage = lazy(() => import('./features/projects/components/ProjectSettingsPage'));
const KanbanBoardPage = lazy(() => import('./features/kanban/components/KanbanBoardPage'));
const GanttChartPage = lazy(() => import('./features/gantt/components/GanttChartPage'));
const CalendarPage = lazy(() => import('./features/calendar/components/CalendarPage'));
const RoadmapPage = lazy(() => import('./features/roadmap/components/RoadmapPage'));
const WikiIndexPage = lazy(() => import('./features/wiki/components/WikiIndexPage'));
const WikiPageEditor = lazy(() => import('./features/wiki/components/WikiPageEditor'));
const DocumentListPage = lazy(() => import('./features/documents/components/DocumentListPage'));
const DocumentDetailPage = lazy(() => import('./features/documents/components/DocumentDetailPage'));

// Admin pages
const AdminUsersPage = lazy(() => import('./features/admin/components/AdminUsersPage'));
const AdminRolesPage = lazy(() => import('./features/admin/components/AdminRolesPage'));
const AdminTrackersPage = lazy(() => import('./features/admin/components/AdminTrackersPage'));
const AdminStatusesPage = lazy(() => import('./features/admin/components/AdminStatusesPage'));
const AdminPrioritiesPage = lazy(() => import('./features/admin/components/AdminPrioritiesPage'));
const AdminCustomFieldsPage = lazy(() => import('./features/admin/components/AdminCustomFieldsPage'));
const AdminWorkflowsPage = lazy(() => import('./features/admin/components/AdminWorkflowsPage'));
const AdminIssueTemplatesPage = lazy(() => import('./features/admin/components/AdminIssueTemplatesPage'));
const AdminGroupsPage = lazy(() => import('./features/admin/components/AdminGroupsPage'));
const GroupDashboardPage = lazy(() => import('./features/admin/components/GroupDashboardPage'));
const AdminSettingsPage = lazy(() => import('./features/admin/components/AdminSettingsPage'));

// Search
const SearchResultsPage = lazy(() => import('./features/search/components/SearchResultsPage'));

// My Page
const MyPage = lazy(() => import('./features/mypage/components/MyPage'));

// Activity
const ActivityPage = lazy(() => import('./features/activity/components/ActivityPage'));

// News
const NewsPage = lazy(() => import('./features/news/components/NewsPage'));

// Forums
const ForumPage = lazy(() => import('./features/forums/components/ForumPage'));

// Reports
const TimeReportPage = lazy(() => import('./features/reports/components/TimeReportPage'));

// User Settings
const UserSettingsPage = lazy(() => import('./features/settings/components/UserSettingsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('ErrorBoundary:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">페이지 렌더링 오류</Typography>
            <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {this.state.error.message}
            </Typography>
            <Typography variant="caption" sx={{ mt: 1, display: 'block', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
              {this.state.error.stack}
            </Typography>
          </Alert>
          <Button variant="contained" onClick={() => { this.setState({ error: null }); window.location.reload(); }}>
            새로고침
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

function Loading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );
}

function withRouteBoundary(element: ReactNode) {
  return <ErrorBoundary>{element}</ErrorBoundary>;
}

function AppContent() {
  const { mode } = useThemeStore();

  const { data: appSettings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: () =>
      axiosInstance
        .get<AppSettingsResponse>('/settings/app')
        .then((res) => res.data),
    staleTime: 30 * 60 * 1000,
  });

  const primaryColor = appSettings?.primaryColor;
  const theme = useMemo(() => createAppTheme(mode, primaryColor), [mode, primaryColor]);

  // Dynamic browser tab title & favicon
  useEffect(() => {
    document.title = appSettings?.appName || 'Nexmine';
  }, [appSettings?.appName]);

  useEffect(() => {
    if (appSettings?.faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = '/api/settings/favicon';
    }
  }, [appSettings?.faviconUrl]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || appSettings?.googleClientId || '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
      <BrowserRouter>
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <Routes>
              {/* Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={withRouteBoundary(<LoginPage />)} />
                <Route path="/register" element={withRouteBoundary(<RegisterPage />)} />
              </Route>

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={withRouteBoundary(<DashboardPage />)} />
                  <Route path="/my/page" element={withRouteBoundary(<MyPage />)} />
                  <Route path="/my/settings" element={withRouteBoundary(<UserSettingsPage />)} />
                  <Route path="/projects" element={withRouteBoundary(<ProjectListPage />)} />

                  <Route path="/projects/:identifier">
                    <Route index element={withRouteBoundary(<ProjectDetailPage />)} />
                    <Route path="issues" element={withRouteBoundary(<IssueListPage />)} />
                    <Route path="issues/new" element={withRouteBoundary(<IssueCreatePage />)} />
                    <Route path="issues/:id" element={withRouteBoundary(<IssueDetailPage />)} />
                    <Route path="versions" element={withRouteBoundary(<VersionListPage />)} />
                    <Route path="board" element={withRouteBoundary(<KanbanBoardPage />)} />
                    <Route path="kanban" element={withRouteBoundary(<KanbanBoardPage />)} />
                    <Route path="gantt" element={withRouteBoundary(<GanttChartPage />)} />
                    <Route path="calendar" element={withRouteBoundary(<CalendarPage />)} />
                    <Route path="roadmap" element={withRouteBoundary(<RoadmapPage />)} />
                    <Route path="wiki" element={withRouteBoundary(<WikiIndexPage />)} />
                    <Route path="wiki/new" element={withRouteBoundary(<WikiPageEditor />)} />
                    <Route path="wiki/:slug" element={withRouteBoundary(<WikiIndexPage />)} />
                    <Route path="wiki/:slug/edit" element={withRouteBoundary(<WikiPageEditor />)} />
                    <Route path="documents" element={withRouteBoundary(<DocumentListPage />)} />
                    <Route path="documents/:id" element={withRouteBoundary(<DocumentDetailPage />)} />
                    <Route path="forums" element={withRouteBoundary(<ForumPage />)} />
                    <Route path="news" element={withRouteBoundary(<NewsPage />)} />
                    <Route path="activity" element={withRouteBoundary(<ActivityPage />)} />
                    <Route path="settings" element={withRouteBoundary(<ProjectSettingsPage />)} />
                  </Route>

                  <Route path="/activity" element={withRouteBoundary(<ActivityPage />)} />
                  <Route path="/reports/time" element={withRouteBoundary(<TimeReportPage />)} />
                  <Route path="/search" element={withRouteBoundary(<SearchResultsPage />)} />

                  {/* Admin routes */}
                  <Route path="/admin" element={<AdminRoute />}>
                    <Route path="users" element={withRouteBoundary(<AdminUsersPage />)} />
                    <Route path="roles" element={withRouteBoundary(<AdminRolesPage />)} />
                    <Route path="trackers" element={withRouteBoundary(<AdminTrackersPage />)} />
                    <Route path="statuses" element={withRouteBoundary(<AdminStatusesPage />)} />
                    <Route path="priorities" element={withRouteBoundary(<AdminPrioritiesPage />)} />
                    <Route path="custom-fields" element={withRouteBoundary(<AdminCustomFieldsPage />)} />
                    <Route path="workflows" element={withRouteBoundary(<AdminWorkflowsPage />)} />
                    <Route path="issue-templates" element={withRouteBoundary(<AdminIssueTemplatesPage />)} />
                    <Route path="groups" element={withRouteBoundary(<AdminGroupsPage />)} />
                    <Route path="groups/:id/dashboard" element={withRouteBoundary(<GroupDashboardPage />)} />
                    <Route path="settings" element={withRouteBoundary(<AdminSettingsPage />)} />
                  </Route>
                </Route>
              </Route>

              {/* Default redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

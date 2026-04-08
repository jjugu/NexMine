import { lazy, Suspense, Component, useMemo } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, CircularProgress, Box, Alert, Typography, Button } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/ko';
import { createAppTheme } from './theme/theme';
import { useThemeStore } from './stores/themeStore';
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

// Search
const SearchResultsPage = lazy(() => import('./features/search/components/SearchResultsPage'));

// My Page
const MyPage = lazy(() => import('./features/mypage/components/MyPage'));

// Activity
const ActivityPage = lazy(() => import('./features/activity/components/ActivityPage'));

// Reports
const TimeReportPage = lazy(() => import('./features/reports/components/TimeReportPage'));

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

function AppContent() {
  const { mode } = useThemeStore();
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
      <BrowserRouter>
        <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/my/page" element={<MyPage />} />
                <Route path="/projects" element={<ProjectListPage />} />
                <Route path="/projects/:identifier" element={<ProjectDetailPage />} />
                <Route path="/projects/:identifier/issues" element={<IssueListPage />} />
                <Route path="/projects/:identifier/issues/new" element={<IssueCreatePage />} />
                <Route path="/projects/:identifier/issues/:id" element={<IssueDetailPage />} />
                <Route path="/projects/:identifier/versions" element={<VersionListPage />} />
                <Route path="/projects/:identifier/board" element={<KanbanBoardPage />} />
                <Route path="/projects/:identifier/kanban" element={<KanbanBoardPage />} />
                <Route path="/projects/:identifier/gantt" element={<GanttChartPage />} />
                <Route path="/projects/:identifier/calendar" element={<CalendarPage />} />
                <Route path="/projects/:identifier/roadmap" element={<RoadmapPage />} />
                <Route path="/projects/:identifier/wiki" element={<WikiIndexPage />} />
                <Route path="/projects/:identifier/wiki/new" element={<WikiPageEditor />} />
                <Route path="/projects/:identifier/wiki/:slug" element={<WikiIndexPage />} />
                <Route path="/projects/:identifier/wiki/:slug/edit" element={<WikiPageEditor />} />
                <Route path="/projects/:identifier/documents" element={<DocumentListPage />} />
                <Route path="/projects/:identifier/documents/:id" element={<DocumentDetailPage />} />
                <Route path="/projects/:identifier/activity" element={<ActivityPage />} />
                <Route path="/projects/:identifier/settings" element={<ProjectSettingsPage />} />

                {/* Activity */}
                <Route path="/activity" element={<ActivityPage />} />

                {/* Reports */}
                <Route path="/reports/time" element={<TimeReportPage />} />

                {/* Search */}
                <Route path="/search" element={<SearchResultsPage />} />

                {/* Admin routes - protected by AdminRoute */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/roles" element={<AdminRolesPage />} />
                  <Route path="/admin/trackers" element={<AdminTrackersPage />} />
                  <Route path="/admin/statuses" element={<AdminStatusesPage />} />
                  <Route path="/admin/priorities" element={<AdminPrioritiesPage />} />
                  <Route path="/admin/custom-fields" element={<AdminCustomFieldsPage />} />
                  <Route path="/admin/workflows" element={<AdminWorkflowsPage />} />
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
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

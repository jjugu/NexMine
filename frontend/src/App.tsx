import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from './theme/theme';
import AuthLayout from './components/layout/AuthLayout';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

const LoginPage = lazy(() => import('./features/auth/components/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/components/RegisterPage'));
const DashboardPage = lazy(() => import('./features/dashboard/components/DashboardPage'));
const ProjectListPage = lazy(() => import('./features/projects/components/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('./features/projects/components/ProjectDetailPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function Loading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
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
                  <Route path="/projects" element={<ProjectListPage />} />
                  <Route path="/projects/:identifier" element={<ProjectDetailPage />} />
                </Route>
              </Route>

              {/* Default redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

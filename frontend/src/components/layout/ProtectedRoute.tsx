import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuthStore } from '../../stores/authStore';
import axiosInstance from '../../api/axiosInstance';

export default function ProtectedRoute() {
  const { isAuthenticated, token, setAuth, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(() => !!token && !isAuthenticated);

  useEffect(() => {
    if (token && !isAuthenticated) {
      axiosInstance
        .get('/Auth/me')
        .then((res) => {
          setAuth(res.data, token);
        })
        .catch(() => {
          clearAuth();
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [token, isAuthenticated, setAuth, clearAuth]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

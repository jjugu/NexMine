import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import { renderWithProviders } from '../test-utils';

// Mock axios
vi.mock('../api/axiosInstance', () => ({
  default: {
    get: vi.fn(() => new Promise(() => {})), // never resolves to keep loading state
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

function TestApp() {
  return (
    <Routes>
      <Route path="/login" element={<div>Login Page</div>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Route>
    </Routes>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    localStorage.clear();
  });

  it('should redirect to login when not authenticated', () => {
    renderWithProviders(<TestApp />, { initialRoute: '/dashboard' });

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should render protected content when authenticated', () => {
    useAuthStore.setState({
      user: { id: 1, username: 'admin', email: 'admin@test.com', isAdmin: true } as any,
      token: 'valid-token',
      isAuthenticated: true,
    });

    renderWithProviders(<TestApp />, { initialRoute: '/dashboard' });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should show loading when token exists but not authenticated', () => {
    useAuthStore.setState({
      user: null,
      token: 'stale-token',
      isAuthenticated: false,
    });

    renderWithProviders(<TestApp />, { initialRoute: '/dashboard' });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});

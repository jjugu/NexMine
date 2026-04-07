import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import AdminRoute from '../components/layout/AdminRoute';
import { renderWithProviders } from '../test-utils';

// Mock axios
vi.mock('../api/axiosInstance', () => ({
  default: {
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

function TestAdminApp() {
  return (
    <Routes>
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<div>Admin Panel</div>} />
      </Route>
    </Routes>
  );
}

describe('AdminRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render admin content for admin users', () => {
    useAuthStore.setState({
      user: { id: 1, username: 'admin', email: 'admin@test.com', isAdmin: true } as any,
      token: 'valid-token',
      isAuthenticated: true,
    });

    renderWithProviders(<TestAdminApp />, { initialRoute: '/admin' });

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('should deny access for non-admin users', () => {
    useAuthStore.setState({
      user: { id: 2, username: 'user', email: 'user@test.com', isAdmin: false } as any,
      token: 'valid-token',
      isAuthenticated: true,
    });

    renderWithProviders(<TestAdminApp />, { initialRoute: '/admin' });

    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });
});

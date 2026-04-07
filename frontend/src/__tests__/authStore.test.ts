import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../stores/authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    localStorage.clear();
  });

  it('should start with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('should set auth state on login', () => {
    const mockUser = { id: 1, username: 'admin', email: 'admin@test.com', isAdmin: true };
    useAuthStore.getState().setAuth(mockUser as any, 'test-token');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.username).toBe('admin');
    expect(state.token).toBe('test-token');
    expect(localStorage.getItem('nexmine-token')).toBe('test-token');
  });

  it('should clear auth state on logout', () => {
    const mockUser = { id: 1, username: 'admin', email: 'admin@test.com', isAdmin: true };
    useAuthStore.getState().setAuth(mockUser as any, 'test-token');
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(localStorage.getItem('nexmine-token')).toBeNull();
  });

  it('should update user info', () => {
    const mockUser = { id: 1, username: 'admin', email: 'admin@test.com', isAdmin: true };
    useAuthStore.getState().setAuth(mockUser as any, 'test-token');

    const updatedUser = { id: 1, username: 'admin', email: 'new@test.com', isAdmin: true };
    useAuthStore.getState().updateUser(updatedUser as any);

    const state = useAuthStore.getState();
    expect(state.user?.email).toBe('new@test.com');
    expect(state.isAuthenticated).toBe(true);
  });
});

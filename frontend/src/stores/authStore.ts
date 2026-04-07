import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserDto } from '../api/generated/model';

interface AuthState {
  user: UserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserDto, token: string) => void;
  clearAuth: () => void;
  updateUser: (user: UserDto) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user: UserDto, token: string) => {
        localStorage.setItem('nexmine-token', token);
        set({ user, token, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem('nexmine-token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (user: UserDto) => {
        set({ user });
      },
    }),
    {
      name: 'nexmine-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

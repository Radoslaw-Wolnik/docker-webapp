import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, User } from '../types';
import { authApi } from '../api/api';
import toast from 'react-hot-toast';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  createAnonymous: (username: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({ // (set, get) => ({ if i would be geting response
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(email, password);
          if (response.success) {
            const { user, token } = response.data!;
            localStorage.setItem('token', token);
            set({ user, token, isAuthenticated: true });
            toast.success('Logged in successfully');
          }
        } catch (error: any) {
          toast.error(error.error || 'Login failed');
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(username, email, password);
          if (response.success) {
            const { user, token } = response.data!;
            localStorage.setItem('token', token);
            set({ user, token, isAuthenticated: true });
            toast.success('Account created successfully');
          }
        } catch (error: any) {
          toast.error(error.error || 'Registration failed');
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        authApi.logout().catch(() => {});
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
        toast.success('Logged out successfully');
      },

      createAnonymous: async (username: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.createAnonymous(username);
          if (response.success) {
            const { user, token } = response.data!;
            localStorage.setItem('token', token);
            set({ user, token, isAuthenticated: true });
            toast.success('Welcome!');
          }
        } catch (error: any) {
          toast.error(error.error || 'Failed to create anonymous user');
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      setToken: (token: string | null) => {
        set({ token });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        set({ isLoading: true });
        try {
          const response = await authApi.getProfile();
          if (response.success) {
            set({ 
              user: response.data!, 
              token, 
              isAuthenticated: true 
            });
          }
        } catch (error) {
          localStorage.removeItem('token');
          set({ user: null, token: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
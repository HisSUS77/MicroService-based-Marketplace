import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,

      login: async (credentials) => {
        set({ loading: true });
        try {
          const response = await axios.post(`${API_URL}/auth/login`, credentials);
          const { user, accessToken, refreshToken } = response.data.data;
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            loading: false,
          });
          
          toast.success('Login successful!');
          return true;
        } catch (error) {
          set({ loading: false });
          toast.error(error.response?.data?.error || 'Login failed');
          return false;
        }
      },

      register: async (userData) => {
        set({ loading: true });
        try {
          const response = await axios.post(`${API_URL}/auth/register`, userData);
          const { user, accessToken, refreshToken } = response.data.data;
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            loading: false,
          });
          
          toast.success('Registration successful!');
          return true;
        } catch (error) {
          set({ loading: false });
          toast.error(error.response?.data?.error || 'Registration failed');
          return false;
        }
      },

      logout: async () => {
        try {
          const { refreshToken } = get();
          if (refreshToken) {
            await axios.post(
              `${API_URL}/auth/logout`,
              { refreshToken },
              {
                headers: { Authorization: `Bearer ${get().accessToken}` },
              }
            );
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          toast.success('Logged out successfully');
        }
      },

      getAccessToken: () => get().accessToken,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

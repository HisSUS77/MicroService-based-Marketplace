import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Token expired - try to refresh
      const refreshToken = useAuthStore.getState().refreshToken;
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data.data;
          useAuthStore.setState({ accessToken });
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed - logout user
          useAuthStore.getState().logout();
          toast.error('Session expired. Please login again.');
          return Promise.reject(refreshError);
        }
      } else {
        useAuthStore.getState().logout();
      }
    }

    // Handle other errors
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  getCurrentUser: () => api.get('/auth/me'),
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getBySeller: (sellerId, params) => api.get(`/products/seller/${sellerId}`, { params }),
};

export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  getAll: () => api.get('/orders/all/admin'),
};

export const paymentsAPI = {
  process: (data) => api.post('/payments/process', data),
  getByOrderId: (orderId) => api.get(`/payments/order/${orderId}`),
};

export default api;

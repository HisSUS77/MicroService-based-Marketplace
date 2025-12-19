import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

// Service URLs - adjust based on environment
const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = import.meta.env.VITE_PRODUCT_URL || 'http://localhost:3002';
const ORDER_SERVICE_URL = import.meta.env.VITE_ORDER_URL || 'http://localhost:3003';
const PAYMENT_SERVICE_URL = import.meta.env.VITE_PAYMENT_URL || 'http://localhost:3004';

// Create axios instance with default config
const createApiInstance = (baseURL) => axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Service-specific API instances
const authApi = createApiInstance(AUTH_SERVICE_URL);
const productApi = createApiInstance(PRODUCT_SERVICE_URL);
const orderApi = createApiInstance(ORDER_SERVICE_URL);
const paymentApi = createApiInstance(PAYMENT_SERVICE_URL);

// Add request interceptor to all API instances
const setupInterceptors = (apiInstance) => {
  // Request interceptor - add auth token
  apiInstance.interceptors.request.use(
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
  apiInstance.interceptors.response.use(
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
            const response = await axios.post(`${AUTH_SERVICE_URL}/auth/refresh`, {
              refreshToken,
            });
            
            const { accessToken } = response.data.data;
            useAuthStore.setState({ accessToken });
            
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiInstance(originalRequest);
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
};

// Setup interceptors for all instances
[authApi, productApi, orderApi, paymentApi].forEach(setupInterceptors);

// API methods
export const authAPI = {
  login: (credentials) => authApi.post('/auth/login', credentials),
  register: (userData) => authApi.post('/auth/register', userData),
  logout: (refreshToken) => authApi.post('/auth/logout', { refreshToken }),
  getCurrentUser: () => authApi.get('/auth/me'),
};

export const productsAPI = {
  getAll: (params) => productApi.get('/products', { params }),
  getById: (id) => productApi.get(`/products/${id}`),
  create: (data) => productApi.post('/products', data),
  update: (id, data) => productApi.put(`/products/${id}`, data),
  delete: (id) => productApi.delete(`/products/${id}`),
  getBySeller: (sellerId, params) => productApi.get(`/products/seller/${sellerId}`, { params }),
};

export const ordersAPI = {
  create: (data) => orderApi.post('/orders', data),
  getMyOrders: () => orderApi.get('/orders'),
  getById: (id) => orderApi.get(`/orders/${id}`),
  getAll: () => orderApi.get('/orders/all/admin'),
};

export const paymentsAPI = {
  process: (data) => paymentApi.post('/payments/process', data),
  getByOrderId: (orderId) => paymentApi.get(`/payments/order/${orderId}`),
};

export default authApi;

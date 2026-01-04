import axios from 'axios';



// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  // Step 1: Send OTP
  sendOTP: (email) => api.post('/users/send-otp', { email }),
  // Step 2: Verify OTP and register
  verifyOTPAndRegister: (data) => api.post('/users/verify-otp-register', data),
  register: (userData) => api.post('/users/register', userData),
  getCurrentUser: () => api.get('/users/me'),
  registerAdmin: (userData) => api.post('/users/register-admin', userData),
  requestPasswordReset: (email) => api.post('/users/request-password-reset', { email }),
  resetPassword: (data) => api.post('/users/reset-password', data),
  
};



{

}

export const userAPI = {
  createCashier: (userData) => api.post('/users/create-cashier', userData),
  deleteUser: (userId) => api.delete(`/users/delete-user/${userId}`),
};

export default api;

export const orderAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getRecentOrders: () => api.get('/orders'),
};

export const dashboardAPI = {
  getHomeData: () => api.get('/dashboard/home-data'),
};
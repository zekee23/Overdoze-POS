import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const dashboardAPI = {
  getMonthlyDashboard: async (month) => {
    const response = await api.get('/dashboard/monthly', {
      params: { month }
    });
    return response.data;
  },

  setMonthlyCash: async (month, startingCash) => {
    const response = await api.post('/dashboard/admin/monthly-cash', {
      month,
      starting_cash: startingCash
    });
    return response.data;
  }
};

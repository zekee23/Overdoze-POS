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
  },

  // Monthly Reports Management
  saveMonthlyReport: async (month) => {
    const response = await api.post('/dashboard/reports/save', {
      month
    });
    return response.data;
  },

  getSavedReports: async (page = 1, limit = 10) => {
    const response = await api.get('/dashboard/reports', {
      params: { page, limit }
    });
    return response.data;
  },

  deleteSavedReport: async (reportId) => {
    const response = await api.delete(`/dashboard/reports/${reportId}`);
    return response.data;
  },

  // PDF Report Management
  generateMonthlyPDF: async (month) => {
    const response = await api.post('/dashboard/reports/generate-pdf', {
      month
    });
    return response.data;
  },

  downloadMonthlyPDF: async (month) => {
    const response = await api.get('/dashboard/reports/download-pdf', {
      params: { month },
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `monthly-report-${month}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getGeneratedReports: async () => {
    const response = await api.get('/dashboard/reports/list');
    return response.data;
  },

  deleteGeneratedReport: async (reportId) => {
    const response = await api.delete(`/dashboard/reports/${reportId}`);
    return response.data;
  }
};

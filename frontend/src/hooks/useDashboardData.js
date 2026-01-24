import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { dashboardAPI } from '../api/dashboard';

export const useDashboardData = (selectedMonth, authLoading) => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboardData = useCallback(async (month) => {
    setLoading(true);
    try {
      const data = await dashboardAPI.getMonthlyDashboard(month);
      setDashboardData(data);
    } catch (error) {
      message.error('Failed to fetch dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      fetchDashboardData(selectedMonth);
    }
  }, [selectedMonth, authLoading, fetchDashboardData]);

  const handleRefresh = async () => {
    await fetchDashboardData(selectedMonth);
    message.success('Dashboard data refreshed');
  };

  return {
    loading,
    dashboardData,
    fetchDashboardData,
    handleRefresh
  };
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from 'antd/es/card';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Spin from 'antd/es/spin';
import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import Space from 'antd/es/space';
import Statistic from 'antd/es/statistic';
import { UserOutlined, LogoutOutlined, DollarOutlined, ShoppingCartOutlined, TeamOutlined, MenuOutlined } from '@ant-design/icons';
import { dashboardAPI } from '../utils/api';
import { useRefreshRateLimit } from '../hooks/useRefreshRateLimit';
import RateLimitedRefreshButton from '../components/RateLimitedRefreshButton';
import SalesChart from '../components/SalesChart';
import RecentOrders from '../components/RecentOrders';
import OverlaySidebar from '../components/OverlaySidebar';
import './Dashboard.css';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    KPIToday: [],
    Hourly_Orders: []
  });
  const navigate = useNavigate();

  // Rate limiting hook - 3 second delay for dashboard refreshes
  const refreshRateLimit = useRefreshRateLimit({ 
    defaultDelay: 3000
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!userData || !token) {
          navigate('/login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // If user is not admin, redirect to appropriate dashboard
        if (parsedUser.u_role !== 'admin') {
          navigate(parsedUser.u_role === 'cashier' ? '/pos' : '/');
          return;
        }

        // Fetch dashboard data
        await fetchDashboardData();
      } catch (error) {
        navigate('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setDataLoading(true);
      const response = await dashboardAPI.getHomeData();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set default data to prevent empty states
      setDashboardData({
        KPIToday: [],
        Hourly_Orders: []
      });
    } finally {
      setDataLoading(false);
    }
  };

  // Refresh function for the refresh button
  const handleRefresh = async () => {
    try {
      await fetchDashboardData();
      const { message } = await import('antd');
      message.success('Dashboard data refreshed successfully');
    } catch (error) {
      if (!error.isRateLimit) {
        const { message } = await import('antd');
        message.error('Failed to refresh dashboard data');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0f172a',
        color: '#d1d5db'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text style={{ color: '#9ca3af' }}>Authenticating...</Text>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will be redirected by the effect
  }

  // Calculate totals
  const totalOrders = dashboardData.KPIToday.reduce((sum, item) => sum + parseInt(item.total_orders || 0), 0);
  const totalSales = dashboardData.KPIToday.reduce((sum, item) => sum + parseFloat(item.total_sales || 0), 0);

  return (
    <div className="dashboard-dark" style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      padding: '0'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#1f2937',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid #374151'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setSidebarOpen(true)}
              style={{
                color: '#3b82f6',
                border: 'none',
                marginRight: '16px',
                fontSize: '18px',
                padding: '8px',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                transition: 'all 0.3s ease'
              }}
              className="hamburger-menu-btn"
            />
            <Title level={3} style={{ margin: 0, color: '#3b82f6' }}>
              Admin Dashboard
            </Title>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <RateLimitedRefreshButton
              onRefresh={handleRefresh}
              operationKey="dashboard"
              delay={3000}
              loading={dataLoading}
              rateLimitHook={refreshRateLimit}
              buttonProps={{
                style: { minWidth: '120px' }
              }}
            />
            
            <div style={{
              backgroundColor: '#374151',
              padding: '8px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #4b5563'
            }}>
              <UserOutlined style={{ marginRight: '8px', color: '#3b82f6' }} />
              <Text strong style={{ color: '#f3f4f6' }}>
                {user.full_name || user.username || 'Admin'}
              </Text>
            </div>
            
            <Button 
              type="primary" 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px'
      }}>
        {/* Welcome Section */}
        <Card style={{ marginBottom: '24px', backgroundColor: '#2d3748', borderColor: '#4a5568', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={2} style={{ margin: 0, color: '#f3f4f6' }}>
                Welcome back, {user.full_name || user.username}!
              </Title>
              <Text style={{ color: '#9ca3af' }}>
                Here's what's happening with your business today
              </Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text style={{ color: '#9ca3af' }}>Role: </Text>
              <Text strong style={{ color: '#3b82f6' }}>{user.u_role}</Text>
              <br />
              <Text style={{ color: '#9ca3af' }}>Email: </Text>
              <Text style={{ color: '#d1d5db' }}>{user.email}</Text>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          {dataLoading ? (
            // Loading skeleton for stats cards
            [1, 2, 3, 4].map((index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <Card variant="borderless" style={{ textAlign: 'center', backgroundColor: '#2d3748', borderRadius: '12px' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: '16px' }}>
                    <Text style={{ color: '#9ca3af' }}>Loading...</Text>
                  </div>
                </Card>
              </Col>
            ))
          ) : (
            // Actual stats cards
            <>
              <Col xs={24} sm={12} md={6}>
                <Card variant="borderless" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.25)' }}>
                  <Statistic
                    title={<span style={{ color: '#fff' }}>Total Orders</span>}
                    value={totalOrders}
                    prefix={<ShoppingCartOutlined />}
                    styles={{ content: { color: '#fff' } }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card variant="borderless" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.25)' }}>
                  <Statistic
                    title={<span style={{ color: '#fff' }}>Total Sales</span>}
                    value={totalSales}
                    precision={2}
                    prefix="PHP"
                    styles={{ content: { color: '#fff' } }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card variant="borderless" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(245, 158, 11, 0.25)' }}>
                  <Statistic
                    title={<span style={{ color: '#fff' }}>Cashier Today</span>}
                    value={dashboardData.KPIToday.length > 0 
                      ? dashboardData.KPIToday.map(cashier => cashier.cashier_name || 'Unassigned').join(', ')
                      : 'No cashiers today'
                    }
                    prefix={<TeamOutlined />}
                    styles={{ 
                      content: {
                        color: '#fff',
                        fontSize: '25px',
                        fontWeight: 'bold',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word'
                      }
                    }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card variant="borderless" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(239, 68, 68, 0.25)' }}>
                  <Statistic
                    title={<span style={{ color: '#fff' }}>Avg per Order</span>}
                    value={totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : 0}
                    precision={2}
                    prefix="PHP"
                    styles={{ content: { color: '#fff' } }}
                  />
                </Card>
              </Col>
            </>
          )}
        </Row>

        {/* Charts and Orders Section */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            {dataLoading ? (
              <Card title="Today's Orders by Hour" style={{ height: '500px', backgroundColor: '#2d3748', borderColor: '#4a5568', borderRadius: '12px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '400px' 
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '16px' }}>
                      <Text style={{ color: '#9ca3af' }}>Loading chart data...</Text>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card title="Today's Orders by Hour" style={{ height: '500px', backgroundColor: '#2d3748', borderColor: '#4a5568', borderRadius: '12px' }}>
                <SalesChart data={dashboardData.Hourly_Orders} />
              </Card>
            )}
          </Col>
          <Col xs={24} lg={12}>
            <RecentOrders />
          </Col>
        </Row>

      </div>
      
      {/* Overlay Sidebar */}
      <OverlaySidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
    </div>
  );
};

export default Dashboard;

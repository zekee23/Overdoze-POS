import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useNavigate } from 'react-router-dom';
import Card from 'antd/es/card';
import Row from 'antd/es/row';
import Col from 'antd/es/col';
import Spin from 'antd/es/spin';
import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import Statistic from 'antd/es/statistic';
import Modal from 'antd/es/modal';
import Input from 'antd/es/input';
import Form from 'antd/es/form';
import { UserOutlined, LogoutOutlined, DollarOutlined, ShoppingCartOutlined, TeamOutlined, MenuOutlined, WalletOutlined, StockOutlined } from '@ant-design/icons';
import { dashboardAPI, cupStockAPI } from '../utils/api';
import { useRefreshRateLimit } from '../hooks/useRefreshRateLimit';
import { Select } from 'antd';
const SalesChart = lazy(() => import('../components/SalesChart'));
const RecentOrders = lazy(() => import('../components/RecentOrders'));
const OverlaySidebar = lazy(() => import('../components/OverlaySidebar'));
const RateLimitedRefreshButton = lazy(() => import('../components/RateLimitedRefreshButton'));
const StartingCashCard = lazy(() => import('../components/StartingCashCard'));
const TotalMoneyCard = lazy(() => import('../components/TotalMoneyCard'));

import './Dashboard.css';

const { Title, Text } = Typography;
const cardStyle = {
  backgroundColor: '#2d3748',
  borderRadius: '12px',
  marginBottom: '24px',
  borderColor: '#4a5568', 
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [stockForm] = Form.useForm();
  const [currentStock, setCurrentStock] = useState({});
  const [dashboardData, setDashboardData] = useState({
    KPIToday: [],
    Hourly_Orders: []
  });
  const [paymentStats, setPaymentStats] = useState({
    cash: { amount: 0, orders: 0, percentage: '0.0' },
    gcash: { amount: 0, orders: 0, percentage: '0.0' },
    total: { amount: 0, orders: 0 }
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('total');
  const navigate = useNavigate();

  // Rate limiting hook - 3 second delay for dashboard refreshes
  const refreshRateLimit = useRefreshRateLimit({ 
    defaultDelay: 3000
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (parsedUser.u_role !== 'admin') {
      navigate(parsedUser.u_role === 'cashier' ? '/pos' : '/');
      return;
    }

    setAuthLoading(false);
  }, [navigate]);

  useEffect(() => {
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading]);

  const { totalOrders, totalSales } = useMemo(() => {
    const orders = dashboardData.KPIToday.reduce(
      (sum, item) => sum + Number(item.total_orders || 0),
      0
    );
    const sales = dashboardData.KPIToday.reduce(
      (sum, item) => sum + Number(item.total_sales || 0),
      0
    );

    return { totalOrders: orders, totalSales: sales };
  }, [dashboardData.KPIToday]);

  const fetchDashboardData = async () => {
    try {
      setDataLoading(true);
      const response = await dashboardAPI.getHomeData();
      setDashboardData(response.data);
      // Also fetch payment statistics
      await fetchPaymentStats();
    } catch (error) {
      setDashboardData({ KPIToday: [], Hourly_Orders: [] });
    } finally {
      setDataLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const response = await dashboardAPI.getPaymentStats('today');
      setPaymentStats(response.data);
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      // Keep default values on error
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

  const handleStockModalOpen = () => {
    setStockModalVisible(true);
  };

  const handleStockModalClose = () => {
    setStockModalVisible(false);
    stockForm.resetFields();
  };

  const handleStockSubmit = async (values) => {
    try {
      // Call the direct update API
      await cupStockAPI.updateStock(
        parseInt(values.cup16oz) || 0,
        parseInt(values.cup12oz) || 0,
        parseInt(values.cup22oz) || 0
      );
      
      const { message } = await import('antd');
      message.success('Stock updated successfully');
      handleStockModalClose();
      
    } catch (error) {
      console.error('Error updating stock:', error);
      const { message } = await import('antd');
      message.error('Failed to update stock');
    }
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
            
            <Button 
              type="primary" 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
            >
              Logout
            </Button>
            <Button 
              type="primary" 
              icon={<StockOutlined />}
              onClick={handleStockModalOpen}
              style={{ marginLeft: '8px', backgroundColor: '#10b981', borderColor: '#10b981' }}
            >
              Cup Stock
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
        <Card style={cardStyle}>
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
            [1, 2, 3, 4, 5, 6].map((index) => (
              <Col xs={24} sm={12} md={8} lg={8} xl={8} key={index}>
                <Card variant="borderless" style={{ textAlign: 'center', backgroundColor: '#2d3748', borderRadius: '12px', minHeight: '140px' }}>
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
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Card 
                  variant="borderless" 
                  style={{ 
                    borderRadius: '12px', 
                    minHeight: '140px'
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <Select
                      value={selectedPaymentMethod}
                      onChange={setSelectedPaymentMethod}
                      style={{ width: 140 }}
                      className="payment-method-select"
                    >
                      <Select.Option value="total">Total Sales</Select.Option>
                      <Select.Option value="cash">Cash Sales</Select.Option>
                      <Select.Option value="gcash">GCash Sales</Select.Option>
                    </Select>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>
                      {selectedPaymentMethod === 'cash' ? 'Cash Sales' : 
                       selectedPaymentMethod === 'gcash' ? 'GCash Sales' : 'Total Sales'}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f3f4f6' }}>
                      PHP {(selectedPaymentMethod === 'cash' ? paymentStats.cash.amount : 
                             selectedPaymentMethod === 'gcash' ? paymentStats.gcash.amount : 
                             paymentStats.total.amount).toFixed(2)}
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Card 
                  variant="borderless" 
                  style={{ 
                    borderRadius: '12px', 
                    minHeight: '140px'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '52px' }}>
                      Total Orders
                    </div>
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: 'bold', 
                      color: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <ShoppingCartOutlined style={{ fontSize: '24px' }} />
                      {totalOrders}
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Card 
                  variant="borderless" 
                  style={{ 
                    borderRadius: '12px', 
                    minHeight: '140px'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '52px' }}>
                      Average per Order
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f3f4f6' }}>
                      PHP {totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : '0.00'}
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Card 
                  variant="borderless" 
                  style={{ 
                    borderRadius: '12px', 
                    minHeight: '140px'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '56px' }}>
                      Cashier Today
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word'
                    }}>
                      <TeamOutlined style={{ fontSize: '20px' }} />
                      <span>
                        {dashboardData.KPIToday.length > 0 
                          ? dashboardData.KPIToday.map(cashier => cashier.cashier_name || 'Unassigned').join(', ')
                          : 'No cashiers today'
                        }
                      </span>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Suspense fallback={
                  <Card variant="borderless" style={{ textAlign: 'center', backgroundColor: '#2d3748', borderRadius: '12px', minHeight: '140px' }}>
                    <Spin size="large" />
                  </Card>
                }>
                  <StartingCashCard />
                </Suspense>
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Suspense fallback={
                  <Card variant="borderless" style={{ textAlign: 'center', backgroundColor: '#2d3748', borderRadius: '12px', minHeight: '140px' }}>
                    <Spin size="large" />
                  </Card>
                }>
                  <TotalMoneyCard totalSales={totalSales} />
                </Suspense>
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
              <Suspense
                fallback={
                  <Card
                    title="Today's Orders by Hour"
                    style={{
                      height: '500px',
                      backgroundColor: '#2d3748',
                      borderColor: '#4a5568',
                      borderRadius: '12px'
                    }}
                  >
                    <div style={{
                      height: '400px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Spin size="large" />
                    </div>
                  </Card>
                }
              >
                <SalesChart data={dashboardData.Hourly_Orders} />
              </Suspense>
            )}
          </Col>
          
          <Col xs={24} lg={12}>
            <Card
              style={{
                minHeight: '500px',
                backgroundColor: '#2d3748',
                borderColor: '#4a5568',
                borderRadius: '12px'
              }}
            >
              <Suspense
                fallback={
                  <div style={{
                    height: '440px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Spin size="large" />
                  </div>
                }
              >
                <RecentOrders />
              </Suspense>
            </Card>
          </Col>
        </Row>
      </div>
      
      {/* Overlay Sidebar */}
      <Suspense fallback={null}>
        <OverlaySidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
        />
      </Suspense>

      {/* Cup Stock Modal */}
      <Modal
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            color: '#f3f4f6'
          }}>
            <StockOutlined style={{ fontSize: '20px', color: '#10b981' }} />
            <span style={{ fontSize: '18px', fontWeight: '600' }}>Manage Cup Stock</span>
          </div>
        }
        open={stockModalVisible}
        onCancel={handleStockModalClose}
        footer={null}
        width={500}
        styles={{
          body: { 
            backgroundColor: '#1f2937',
            padding: '24px'
          },
          header: { 
            backgroundColor: '#1f2937', 
            borderBottom: '1px solid #374151',
            padding: '16px 24px'
          },
          content: {
            backgroundColor: '#1f2937',
            borderRadius: '12px',
            border: '1px solid #374151'
          }
        }}
        closeIcon={
          <div style={{ 
            color: '#9ca3af', 
            fontSize: '18px',
            padding: '4px',
            borderRadius: '4px',
            transition: 'all 0.2s ease'
          }}>
            ×
          </div>
        }
      >
        <div style={{ 
          marginBottom: '20px',
          padding: '12px 16px',
          backgroundColor: '#065f46',
          border: '1px solid #10b981',
          borderRadius: '8px'
        }}>
          <p style={{ 
            margin: 0, 
            color: '#d1fae5', 
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Enter the current stock quantities for each cup size. These values will replace existing stock counts.
          </p>
        </div>

        <Form
          form={stockForm}
          layout="vertical"
          onFinish={handleStockSubmit}
          style={{ backgroundColor: '#1f2937' }}
        >
          <div style={{ 
            display: 'grid', 
            gap: '20px',
            marginBottom: '24px'
          }}>
            <Form.Item
              label={
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  color: '#f3f4f6',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '50%'
                  }} />
                  16oz Cups Stock
                </div>
              }
              name="cup16oz"
              rules={[{ required: true, message: 'Please enter 16oz cup stock' }]}
            >
              <Input
                type="number"
                placeholder="0"
                size="large"
                style={{ 
                  backgroundColor: '#374151', 
                  borderColor: '#4b5563', 
                  color: '#f3f4f6',
                  borderRadius: '8px',
                  fontSize: '16px',
                  padding: '12px 16px',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#4b5563';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </Form.Item>

            <Form.Item
              label={
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  color: '#f3f4f6',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#10b981',
                    borderRadius: '50%'
                  }} />
                  12oz Cups Stock
                </div>
              }
              name="cup12oz"
              rules={[{ required: true, message: 'Please enter 12oz cup stock' }]}
            >
              <Input
                type="number"
                placeholder="0"
                size="large"
                style={{ 
                  backgroundColor: '#374151', 
                  borderColor: '#4b5563', 
                  color: '#f3f4f6',
                  borderRadius: '8px',
                  fontSize: '16px',
                  padding: '12px 16px',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#4b5563';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </Form.Item>

            <Form.Item
              label={
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  color: '#f3f4f6',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#f59e0b',
                    borderRadius: '50%'
                  }} />
                  22oz Cups Stock
                </div>
              }
              name="cup22oz"
              rules={[{ required: true, message: 'Please enter 22oz cup stock' }]}
            >
              <Input
                type="number"
                placeholder="0"
                size="large"
                style={{ 
                  backgroundColor: '#374151', 
                  borderColor: '#4b5563', 
                  color: '#f3f4f6',
                  borderRadius: '8px',
                  fontSize: '16px',
                  padding: '12px 16px',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#f59e0b';
                  e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#4b5563';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </Form.Item>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px',
            paddingTop: '20px',
            borderTop: '1px solid #374151'
          }}>
            <Button 
              onClick={handleStockModalClose}
              size="large"
              style={{
                backgroundColor: '#374151',
                borderColor: '#4b5563',
                color: '#f3f4f6',
                borderRadius: '8px',
                fontWeight: '500',
                padding: '8px 24px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#4b5563';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#374151';
              }}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              size="large"
              style={{ 
                backgroundColor: '#10b981', 
                borderColor: '#10b981',
                borderRadius: '8px',
                fontWeight: '600',
                padding: '8px 24px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#059669';
                e.target.style.borderColor = '#059669';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#10b981';
                e.target.style.borderColor = '#10b981';
              }}
            >
              Update Stock
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Dashboard;
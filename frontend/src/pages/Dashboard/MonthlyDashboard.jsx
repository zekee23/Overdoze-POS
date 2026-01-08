import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Table, 
  Button, 
  message,
  Space,
  Statistic,
  Modal,
  Form,
  InputNumber,
  DatePicker
} from 'antd';
import { 
  ShoppingCartOutlined, 
  RiseOutlined,
  CalendarOutlined,
  TrophyOutlined,
  MenuOutlined,
  UserOutlined,
  LogoutOutlined,
  ReloadOutlined,
  DownloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { dashboardAPI } from '../../api/dashboard';
import OverlaySidebar from '../../components/OverlaySidebar';
import '../Dashboard.css';
import dayjs from 'dayjs';


const { Title, Text } = Typography;

const MonthlyDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [cashModalVisible, setCashModalVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [form] = Form.useForm();
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);

  const fetchDashboardData = async (month) => {
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
  };

 useEffect(() => {
  if (!authLoading) {
    fetchDashboardData(selectedMonth);
  }
}, [selectedMonth, authLoading]);


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

      if (parsedUser.u_role !== 'admin') {
        navigate(parsedUser.u_role === 'cashier' ? '/landingpage' : '/');
        return;
      }
    } catch (error) {
      navigate('/login');
    } finally {
      setAuthLoading(false);
    }
  };

  checkAuth();
}, [navigate]);

  const handleMonthChange = useCallback((value) => {
    if (value) {
      setSelectedMonth(value.format('YYYY-MM'));
    }
  }, []);

  // Memoize formatCurrency to prevent recreation
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }, []);

  // Memoize top products cards to prevent unnecessary re-renders
  const topProductsCards = useMemo(() => {
    if (!dashboardData?.top_products) return [];
    
    return dashboardData.top_products.map((product, index) => ({
      rank: index + 1,
      ...product
    }));
  }, [dashboardData?.top_products]);

  const handleDownloadSummary = useCallback(() => {
    if (!dashboardData) return;
    
    const summary = {
      month: selectedMonth,
      total_orders: dashboardData.total_orders,
      gross_sales: dashboardData.gross_sales,
      starting_cash: dashboardData.starting_cash,
      profit: dashboardData.profit,
      top_products: dashboardData.top_products
    };
    
    const dataStr = JSON.stringify(summary, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `monthly-summary-${selectedMonth}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [dashboardData, selectedMonth]);

  const handleSetStartingCash = async (values) => {
    try {
      await dashboardAPI.setMonthlyCash(selectedMonth, values.startingCash);
      message.success('Starting cash set successfully');
      setCashModalVisible(false);
      form.resetFields();
      fetchDashboardData(selectedMonth);
    } catch (error) {
      message.error('Failed to set starting cash');
      console.error('Set cash error:', error);
    }
  };

  const handleRefresh = async () => {
    await fetchDashboardData(selectedMonth);
    message.success('Dashboard data refreshed');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (authLoading) {
    return (
      <div className="dashboard-dark" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f172a'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ marginBottom: '16px' }} />
          <Text style={{ color: '#9ca3af' }}>Loading...</Text>
        </div>
      </div>
    );
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
              Monthly Dashboard
            </Title>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                {user?.full_name || user?.username || 'Admin'}
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
        <Card style={{ 
          marginBottom: '24px', 
          background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)', 
          borderColor: 'transparent', 
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{
                  width: '4px',
                  height: '32px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '2px',
                  marginRight: '12px'
                }} />
                <Title level={2} style={{ margin: 0, color: '#f3f4f6', fontWeight: '600' }}>
                  Monthly Performance Overview
                </Title>
              </div>
              <Text style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.4', marginLeft: '16px' }}>
                Track and analyze your monthly sales metrics and top performing products
              </Text>
            </div>
            
            <Space>
             <DatePicker
  picker="month"
  value={dayjs(selectedMonth)}
  onChange={(date) => {
    if (date) {
      setSelectedMonth(date.format('YYYY-MM'));
    }
  }}
  allowClear={false}
  size="middle"
  style={{
    backgroundColor: '#374151',
    border: '1px solid #4b5563',
    borderRadius: '8px',
    color: '#f3f4f6'
  }}
  popupClassName="dark-datepicker"
/>

              <Button 
                type="primary" 
                onClick={() => setCashModalVisible(true)}
                
                style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
              >
                Set Starting Cash
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
                style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
              >
                Refresh
              </Button>
            </Space>
          </div>
        </Card>

      {dashboardData && (
          <>
            {/* KPI Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col xs={24} sm={12} lg={6}>
                <Card 
                  style={{ 
                    backgroundColor: '#1e40af', 
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Statistic
                    title="Total Orders"
                    value={dashboardData.total_orders}
                    valueStyle={{ color: '#fff', fontSize: '32px' }}
                    prefix={<ShoppingCartOutlined style={{ color: '#bfdbfe' }} />}
                  />
                  <Text style={{ color: '#bfdbfe', fontSize: '14px', marginTop: '8px', display: 'block' }}>
                    Orders this month
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card 
                  style={{ 
                    backgroundColor: '#9d174d', 
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Statistic
                    title="Gross Sales"
                    value={dashboardData.gross_sales}
                    formatter={(value) => formatCurrency(value)}
                    valueStyle={{ color: '#fff', fontSize: '32px' }}
                  />
                  <Text style={{ color: '#fbcfe8', fontSize: '14px', marginTop: '8px', display: 'block' }}>
                    Total revenue
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card 
                  style={{ 
                    backgroundColor: '#7c3aed', 
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Statistic
                    title="Starting Cash"
                    value={dashboardData.starting_cash}
                    formatter={(value) => formatCurrency(value)}
                    valueStyle={{ color: '#fff', fontSize: '32px' }}
                  />
                  <Text style={{ color: '#e9d5ff', fontSize: '14px', marginTop: '8px', display: 'block' }}>
                    Initial cash amount
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card 
                  style={{ 
                    backgroundColor: dashboardData.profit >= 0 ? '#065f46' : '#991b1b', 
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Statistic
                    title="Profit"
                    value={dashboardData.profit}
                    formatter={(value) => formatCurrency(value)}
                    valueStyle={{ color: '#fff', fontSize: '32px' }}
                    prefix={<RiseOutlined style={{ color: dashboardData.profit >= 0 ? '#bbf7d0' : '#fecaca' }} />}
                  />
                  <Text style={{ 
                    color: dashboardData.profit >= 0 ? '#bbf7d0' : '#fecaca', 
                    fontSize: '14px', 
                    marginTop: '8px', 
                    display: 'block' 
                  }}>
                    Net profit
                  </Text>
                </Card>
              </Col>
            </Row>

            {/* Top Products Cards and Monthly Summary */}
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <Card 
                  style={{ 
                    background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)', 
                    borderColor: 'transparent', 
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.1)'
                  }}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: '3px',
                        height: '24px',
                        backgroundColor: '#3b82f6',
                        borderRadius: '2px',
                        marginRight: '12px'
                      }} />
                      <Space>
                        <TrophyOutlined style={{ color: '#3b82f6', fontSize: '20px' }} />
                        <Text strong style={{ color: '#f3f4f6', fontSize: '18px', fontWeight: '600' }}>
                          Top 3 Products by Revenue
                        </Text>
                      </Space>
                    </div>
                  }
                >
                  <Row gutter={[12, 12]}>
                    {topProductsCards.map((product, index) => (
                      <Col xs={24} sm={8} key={product.product_name}>
                        <Card
                          style={{
                            background: `linear-gradient(135deg, ${
                              index === 0 ? '#1e40af' : index === 1 ? '#7c3aed' : '#9d174d'
                            } 0%, ${
                              index === 0 ? '#1e3a8a' : index === 1 ? '#6d28d9' : '#881337'
                            } 100%)`,
                            border: 'none',
                            borderRadius: '12px',
                            height: '100%',
                            textAlign: 'center'
                          }}
                        >
                          <div style={{ marginBottom: '12px' }}>
                            <TrophyOutlined 
                              style={{ 
                                fontSize: '24px',
                                color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32' 
                              }} 
                            />
                          </div>
                          <Title level={4} style={{ color: '#fff', margin: '8px 0' }}>
                            #{product.rank}
                          </Title>
                          <Text strong style={{ color: '#f3f4f6', fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                            {product.product_name}
                          </Text>
                          <div style={{ marginTop: '12px' }}>
                            <Text style={{ color: '#bfdbfe', fontSize: '14px', display: 'block' }}>
                              Units Sold: {product.total_sold.toLocaleString()}
                            </Text>
                            <Text style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold', display: 'block', marginTop: '4px' }}>
                              {formatCurrency(product.total_revenue)}
                            </Text>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              </Col>
              
              <Col xs={24} lg={8}>
                <Card 
                  style={{ 
                    background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)', 
                    borderColor: 'transparent', 
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.1)'
                  }}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: '3px',
                        height: '24px',
                        backgroundColor: '#3b82f6',
                        borderRadius: '2px',
                        marginRight: '12px'
                      }} />
                      <Text strong style={{ color: '#f3f4f6', fontSize: '18px', fontWeight: '600' }}>
                        Monthly Summary
                      </Text>
                    </div>
                  }
                  extra={
                    <Space>
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => setSummaryModalVisible(true)}
                        style={{ color: '#3b82f6' }}
                      >
                        View
                      </Button>
                      <Button
                        type="text"
                        icon={<DownloadOutlined />}
                        onClick={handleDownloadSummary}
                        style={{ color: '#10b981' }}
                      >
                        Download
                      </Button>
                    </Space>
                  }
                >
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <CalendarOutlined style={{ fontSize: '24px', color: '#fff' }} />
                    </div>
                    <Text style={{ color: '#9ca3af', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                      {new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </Text>
                    <Text strong style={{ color: '#f3f4f6', fontSize: '16px' }}>
                      Complete monthly report available
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </div>

      {/* Set Starting Cash Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#10b981', fontSize: '18px' }}>₱</span>
            <span style={{ color: '#f3f4f6', fontSize: '16px', fontWeight: 'bold' }}>
              Set Starting Cash
            </span>
          </div>
        }
        open={cashModalVisible}
        onCancel={() => {
          setCashModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={480}
        centered
        closable={true}
        styles={{
          body: { 
            backgroundColor: '#0f172a', 
            color: '#f3f4f6', 
            padding: '16px',
            borderRadius: '8px'
          },
          header: { 
            backgroundColor: '#0f172a', 
            borderBottom: '1px solid #374151',
            borderRadius: '8px 8px 0 0',
            padding: '16px 20px'
          },
          content: { 
            backgroundColor: '#0f172a', 
            color: '#f3f4f6',
            borderRadius: '8px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid #374151'
          },
          mask: { 
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)'
          }
        }}
        wrapClassName="dark-modal-wrapper"
        zIndex={1000}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSetStartingCash}
        >
          <Form.Item
            name="startingCash"
            label="Starting Cash Amount"
            rules={[
              { required: true, message: 'Please enter starting cash amount' },
              { type: 'number', min: 0, message: 'Amount must be positive' }
            ]}
          >
            <InputNumber
              style={{ width: '100%', backgroundColor: '#374151', borderColor: '#4b5563', color: '#f3f4f6' }}
              formatter={(value) => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/₱\s?|(,*)/g, '')}
              placeholder="0.00"
              precision={2}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setCashModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
              >
                Set Cash
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Monthly Summary Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarOutlined style={{ color: '#3b82f6', fontSize: '18px' }} />
            <span style={{ color: '#f3f4f6', fontSize: '16px', fontWeight: 'bold' }}>
              Monthly Summary Report
            </span>
          </div>
        }
        open={summaryModalVisible}
        onCancel={() => setSummaryModalVisible(false)}
        footer={[
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownloadSummary}>
            Download Report
          </Button>,
          <Button key="close" onClick={() => setSummaryModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
        centered
        styles={{
          body: { 
            backgroundColor: '#0f172a', 
            color: '#f3f4f6', 
            padding: '20px'
          },
          header: { 
            backgroundColor: '#0f172a', 
            borderBottom: '1px solid #374151'
          },
          content: { 
            backgroundColor: '#0f172a', 
            color: '#f3f4f6',
            border: '1px solid #374151'
          }
        }}
      >
        {dashboardData && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <Text strong style={{ color: '#3b82f6', fontSize: '16px' }}>
                {new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long'
                })}
              </Text>
            </div>
            
            <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
              <Col span={12}>
                <Card size="small" style={{ backgroundColor: '#1f2937', border: 'none' }}>
                  <Statistic
                    title="Total Orders"
                    value={dashboardData.total_orders}
                    valueStyle={{ color: '#fff' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ backgroundColor: '#1f2937', border: 'none' }}>
                  <Statistic
                    title="Gross Sales"
                    value={dashboardData.gross_sales}
                    formatter={(value) => formatCurrency(value)}
                    valueStyle={{ color: '#fff' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ backgroundColor: '#1f2937', border: 'none' }}>
                  <Statistic
                    title="Starting Cash"
                    value={dashboardData.starting_cash}
                    formatter={(value) => formatCurrency(value)}
                    valueStyle={{ color: '#fff' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ backgroundColor: '#1f2937', border: 'none' }}>
                  <Statistic
                    title="Profit"
                    value={dashboardData.profit}
                    formatter={(value) => formatCurrency(value)}
                    valueStyle={{ 
                      color: dashboardData.profit >= 0 ? '#10b981' : '#ef4444' 
                    }}
                  />
                </Card>
              </Col>
            </Row>
            
            <div>
              <Title level={5} style={{ color: '#f3f4f6', marginBottom: '12px' }}>
                Top Products
              </Title>
              {topProductsCards.map((product, index) => (
                <div key={product.product_name} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #374151'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrophyOutlined 
                      style={{ 
                        color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32' 
                      }} 
                    />
                    <Text style={{ color: '#f3f4f6' }}>{product.product_name}</Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text style={{ color: '#9ca3af', fontSize: '12px', display: 'block' }}>
                      {product.total_sold} units
                    </Text>
                    <Text strong style={{ color: '#10b981' }}>
                      {formatCurrency(product.total_revenue)}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Mobile Sidebar */}
      <OverlaySidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />
      {sidebarOpen && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: window.innerWidth <= 768 ? 'block' : 'none'
          }}
        />
      )}
    </div>
  );
};

export default MonthlyDashboard;

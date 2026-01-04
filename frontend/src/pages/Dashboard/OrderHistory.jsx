import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  message,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  ReloadOutlined,
  MenuOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined,
  ShoppingOutlined,
  CloseOutlined,
  LogoutOutlined
} from '@ant-design/icons';

import OverlaySidebar from '../../components/OverlaySidebar';

import api from '../../utils/api';
import '../Dashboard.css';
import './orderpage.css';

const { Title, Text } = Typography;

const OrderHistory = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [peakHoursData, setPeakHoursData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [orderItemsLoading, setOrderItemsLoading] = useState(false);


  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalOrders: 0,
    limit: 10
  });

  const fetchOrderItems = async (orderId) => {
    try {
      setOrderItemsLoading(true);
      const res = await api.get(`/orders/${orderId}`);
      setOrderItems(res.data.items || res.data || []);
    } catch (err) {
      console.error('Failed to load order items:', err);
      message.error('Failed to load order items');
      setOrderItems([]);
    } finally {
      setOrderItemsLoading(false);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOrderModalVisible(true);
    fetchOrderItems(order.order_id);
  };

  const handleCloseModal = () => {
    setOrderModalVisible(false);
    setSelectedOrder(null);
    setOrderItems([]);
  };
    const fetchOrderHistory = async (page = 1, month = selectedMonth) => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/order-history', {
        params: { page, limit: pagination.limit, month }
      });
      setOrders(res.data.orders);
      setPagination(prev => ({
        ...prev,
        currentPage: res.data.pagination.currentPage,
        totalOrders: res.data.pagination.totalOrders
      }));
    } catch (err) {
      message.error('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

 const fetchPeakHours = async () => {
  try {
    const res = await api.get('/dashboard/peak-hours');

    const peakByOrders = res.data.peakHoursByOrders?.[0] || null;
    const peakBySales = res.data.peakHoursBySales?.[0] || null;

    setPeakHoursData({
      peakHour: peakByOrders?.hour ?? '--',
      peakSales: peakBySales?.total_sales ?? 0
    });
  } catch (err) {
    message.error('Failed to load peak hours data');
  }
};

const handleRefresh = async () => {
  try {
    await fetchOrderHistory(1, selectedMonth);
    await fetchPeakHours();
    message.success('Data refreshed successfully');
  } catch (error) {
    message.error('Failed to refresh data');
  }
};

const formatToStandardTime = (hour) => {
  if (hour === '--') return '--';

  const period = hour >= 12 ? 'PM' : 'AM';
  const standardHour = hour % 12 || 12;

  return `${standardHour}:00 ${period}`;
};



  useEffect(() => {
    fetchOrderHistory(1, selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    fetchPeakHours();
  }, []);

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

        await fetchOrderHistory(1, selectedMonth);
        await fetchPeakHours();
      } catch (error) {
        console.error('Authentication error:', error);
        navigate('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handlePageChange = (page) => {
    fetchOrderHistory(page, selectedMonth);
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

   const columns = [
  {
    title: 'Order ID',
    dataIndex: 'order_id',
    key: 'order_id'
  },
  {
    title: 'Cashier',
    dataIndex: 'cashier_name',
    key: 'cashier_name',
    render: (text) => (
      <Space>
        <UserOutlined />
        {text}
      </Space>
    )
  },
  {
    title: 'Total Amount',
    dataIndex: 'total_amount',
    key: 'total_amount',
    render: (amount) => `₱${Number(amount).toFixed(2)}`
  },
  {
    title: 'Date',
    dataIndex: 'created_at',
    key: 'created_at',
    render: (date) => new Date(date).toLocaleString()
  },
  {
    title: 'Action',
    key: 'action',
    render: (_, record) => (
      <Button
        size="small"
        onClick={() => handleViewOrder(record)}
        style={{ 
          backgroundColor: '#3b82f6', 
          borderColor: '#3b82f6',
          color: '#fff',
          fontWeight: 500
        }}
      >
        View
      </Button>
    )
  }
];


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
          <div className="loading-spinner" style={{ marginBottom: 16 }} />
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
              Order History
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
                {user?.u_name || 'Admin'}
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
          backgroundColor: '#2d3748', 
          borderColor: '#4a5568', 
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={2} style={{ margin: 0, color: '#f3f4f6' }}>
                Order Management Overview
              </Title>
              <Text style={{ color: '#9ca3af' }}>
                Track and analyze your order history and performance metrics
              </Text>
            </div>
            
          </div>
        </Card>

      {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={8}>
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
                value={pagination.totalOrders}
                valueStyle={{ color: '#fff', fontSize: '32px' }}
                prefix={<ShoppingOutlined style={{ color: '#bfdbfe' }} />}
              />
              <Text style={{ color: '#bfdbfe', fontSize: '14px', marginTop: '8px', display: 'block' }}>
                All time order count
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card 
              style={{ 
                backgroundColor: '#9d174d', 
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
             <Statistic
  title="Peak Hour"
  value={formatToStandardTime(peakHoursData?.peakHour)}
  valueStyle={{ color: '#fff', fontSize: '32px' }}
  prefix={<ClockCircleOutlined style={{ color: '#fbcfe8' }} />}
/>

              <Text style={{ color: '#fbcfe8', fontSize: '14px', marginTop: '8px', display: 'block' }}>
                Busiest order time
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card 
              style={{ 
                backgroundColor: '#065f46', 
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
             <Statistic
  title="Peak Sales"
  value={Number(peakHoursData?.peakSales || 0)}
  valueStyle={{ color: '#fff', fontSize: '32px' }}
  formatter={(value) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(value)
  }
/>

              <Text style={{ color: '#bbf7d0', fontSize: '14px', marginTop: '8px', display: 'block' }}>
                Highest sales volume
              </Text>
            </Card>
          </Col>
        </Row>

      {/* Filters */}
        <Card style={{ 
          marginBottom: '24px', 
          backgroundColor: '#2d3748', 
          borderColor: '#4a5568', 
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <Text strong style={{ color: '#f3f4f6', fontSize: '16px' }}>
              Filter by Month:
            </Text>
          </div>
          <Space size={[8, 8]}>
            <Button
              type={selectedMonth === null ? 'primary' : 'default'}
              onClick={() => handleMonthChange(null)}
              style={selectedMonth === null 
                ? { backgroundColor: '#3b82f6', borderColor: '#3b82f6' } 
                : { backgroundColor: '#374151', borderColor: '#4b5563', color: '#f3f4f6' }
              }
            >
              All
            </Button>
            <Button
              type={selectedMonth === 'this' ? 'primary' : 'default'}
              onClick={() => handleMonthChange('this')}
              style={selectedMonth === 'this' 
                ? { backgroundColor: '#3b82f6', borderColor: '#3b82f6' } 
                : { backgroundColor: '#374151', borderColor: '#4b5563', color: '#f3f4f6' }
              }
            >
              This Month
            </Button>
            <Button
              type={selectedMonth === 'last' ? 'primary' : 'default'}
              onClick={() => handleMonthChange('last')}
              style={selectedMonth === 'last' 
                ? { backgroundColor: '#3b82f6', borderColor: '#3b82f6' } 
                : { backgroundColor: '#374151', borderColor: '#4b5563', color: '#f3f4f6' }
              }
            >
              Last Month
            </Button>
          </Space>
        </Card>

      {/* Table */}
        <Card 
          style={{ 
            backgroundColor: '#2d3748', 
            borderColor: '#4a5568', 
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          title={
            <Space>
              <ShoppingOutlined style={{ color: '#3b82f6', fontSize: '20px' }} />
              <Text strong style={{ color: '#f3f4f6', fontSize: '18px' }}>
                Order History
              </Text>
            </Space>
          }
          extra={
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
              style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
            >
              Refresh
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={orders}
            loading={loading}
            rowKey="order_id"
            pagination={{
              current: pagination.currentPage,
              pageSize: pagination.limit,
              total: pagination.totalOrders,
              onChange: handlePageChange,
              showSizeChanger: false,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`,
              style: { color: '#9ca3af' }
            }}
            scroll={{ x: 'max-content' }}
            style={{ color: '#f3f4f6' }}
          />
        </Card>
      </div>

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

      {/* Order Items Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px',}}>
            <ShoppingOutlined style={{ color: '#3b82f6', fontSize: '18px' }} />
            <span style={{ color: '#f3f4f6', fontSize: '16px', fontWeight: 'bold' }}>
              Order #{selectedOrder?.order_id}
            </span>
          </div>
        }
        open={orderModalVisible}
        onCancel={handleCloseModal}
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
        {selectedOrder && (
          <div style={{ minHeight: '200px' }}>
            {/* Order Header - Compact */}
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              color: '#fff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <Text style={{ color: '#bfdbfe', fontSize: '12px', display: 'block' }}>Total</Text>
                  <Text strong style={{ fontSize: '20px', color: '#fff' }}>
                    ₱{Number(selectedOrder.total_amount).toFixed(2)}
                  </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text style={{ color: '#bfdbfe', fontSize: '12px', display: 'block' }}>Cashier</Text>
                  <Text style={{ fontSize: '14px', color: '#fff' }}>{selectedOrder.cashier_name}</Text>
                </div>
              </div>
            </div>

            {/* Order Items - Compact */}
            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ color: '#f3f4f6', fontSize: '14px', marginBottom: '12px', display: 'block' }}>
                Items ({orderItems.length})
              </Text>
              
              {orderItemsLoading ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <div className="loading-spinner" style={{ marginBottom: 12, width: '24px', height: '24px' }} />
                  <Text style={{ color: '#9ca3af', fontSize: '14px' }}>Loading...</Text>
                </div>
              ) : orderItems.length > 0 ? (
                <div 
                  className="order-items-scrollable"
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px', 
                    maxHeight: '280px', 
                    overflowY: 'auto',
                    paddingRight: '2px'
                  }}
                >
                  {orderItems.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        padding: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ color: '#f3f4f6', fontSize: '14px', display: 'block' }}>
                            {item.product_name}
                          </Text>
                          <Text style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginTop: '2px' }}>
                            {item.size_label}
                          </Text>
                          <Text style={{ color: '#6b7280', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                            ₱{Number(item.price_each).toFixed(2)} × {item.quantity}
                          </Text>
                          
                          {/* Display addons if they exist */}
                          {item.addons && item.addons.length > 0 && (
                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #374151' }}>
                              <Text style={{ color: '#9ca3af', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                                Add-ons:
                              </Text>
                              {item.addons.map((addon, addonIndex) => (
                                <div key={addonIndex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                  <Text style={{ color: '#6b7280', fontSize: '10px' }}>
                                    + {addon.extras_name} × {addon.quantity}
                                  </Text>
                                  <Text style={{ color: '#9ca3af', fontSize: '10px' }}>
                                    ₱{Number(addon.price * addon.quantity).toFixed(2)}
                                  </Text>
                                </div>
                              ))}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #374151' }}>
                                <Text strong style={{ color: '#f3f4f6', fontSize: '11px' }}>
                                  Add-ons Total:
                                </Text>
                                <Text strong style={{ color: '#f3f4f6', fontSize: '11px' }}>
                                  ₱{item.addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0).toFixed(2)}
                                </Text>
                              </div>
                            </div>
                          )}
                        </div>
                        <Text strong style={{ color: '#10b981', fontSize: '14px' }}>
                          ₱{Number(item.subtotal).toFixed(2)}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <Text style={{ color: '#9ca3af', fontSize: '14px' }}>No items found</Text>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div style={{ textAlign: 'center', paddingTop: '8px' }}>
              <Button 
                onClick={handleCloseModal}
                style={{ 
                  backgroundColor: '#374151', 
                  borderColor: '#4b5563', 
                  color: '#f3f4f6',
                  width: '100%'
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderHistory;

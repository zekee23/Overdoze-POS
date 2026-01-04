import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Space, Typography, Tag, message, Modal, Row, Col, Statistic } from 'antd';
import { 
  ExclamationCircleOutlined, 
  ReloadOutlined, 
  CheckCircleOutlined, 
  MenuOutlined, 
  UserOutlined, 
  LogoutOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import OverlaySidebar from '../../components/OverlaySidebar';
import api from '../../utils/api';
import '../Dashboard.css';
import './stockpage.css';

const { Title, Text } = Typography;

const StockPage = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [restockModalVisible, setRestockModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [restocking, setRestocking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const fetchOutOfStockItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/out-of-stock');
      setOutOfStockItems(response.data.stock || []);
    } catch (error) {
      message.error('Failed to load out of stock items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutOfStockItems();
  }, []);

  const handleRestock = (product) => {
    setSelectedProduct(product);
    setRestockModalVisible(true);
  };

  const confirmRestock = async () => {
    try {
      setRestocking(true);
      await api.put(`/dashboard/restock/${selectedProduct.product_id}`);
      message.success('Product restocked successfully!');
      setRestockModalVisible(false);
      fetchOutOfStockItems();
    } catch (error) {
      message.error('Failed to restock product');
    } finally {
      setRestocking(false);
    }
  };

    const columns = [
    { 
      title: 'Product ID', 
      dataIndex: 'product_id', 
      key: 'product_id', 
      width: 100,
      render: (text) => <Text style={{ color: '#f3f4f6' }}>{text}</Text>
    },
    { 
      title: 'Product Name', 
      dataIndex: 'product_name', 
      key: 'product_name', 
      ellipsis: true,
      render: (text) => <Text style={{ color: '#f3f4f6' }}>{text}</Text>
    },
    
 
    {
      title: 'Stock Status',
      key: 'status',
      width: 150,
      render: (_, record) => (
        <Tag 
          style={{ 
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '6px',
            color: '#ffffff',
            backgroundColor: record.stock_quantity > 0 ? '#ea580c' : '#dc2626',
            borderColor: record.stock_quantity > 0 ? '#ea580c' : '#dc2626'
          }}
        >
          {record.stock_quantity > 0 ? 'Low Stock' : 'Out of Stock'}
        </Tag>
      )
    },
  
    
    {
      title: 'Action',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => handleRestock(record)}
          style={{ 
            backgroundColor: '#10b981', 
            borderColor: '#10b981',
            fontWeight: 500
          }}
        >
          Restock
        </Button>
      )
    }
  ];

  // Check authentication and fetch data
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
          navigate(parsedUser.u_role === 'cashier' ? '/landingpage' : '/');
          return;
        }

        await fetchOutOfStockItems();
      } catch (error) {
        console.error('Authentication error:', error);
        navigate('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

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
          <div className="loading-spinner" style={{ marginBottom: 16 }} />
          <Text style={{ color: '#9ca3af' }}>Loading...</Text>
        </div>
      </div>
    );
  }

  const totalOutOfStock = outOfStockItems.length;
  const lowStockItems = outOfStockItems.filter(item => item.stock_quantity > 0);
  const outOfStockCount = outOfStockItems.length - lowStockItems.length;

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
              Stock Management
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
          backgroundColor: '#2d3748', 
          borderColor: '#4a5568', 
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={2} style={{ margin: 0, color: '#f3f4f6' }}>
                Stock Status Overview
              </Title>
              <Text style={{ color: '#9ca3af' }}>
                Monitor and manage your inventory levels
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
                title="Total Out of Stock"
                value={totalOutOfStock}
                valueStyle={{ color: '#fff', fontSize: '32px' }}
                prefix={<ExclamationCircleOutlined style={{ color: '#fecaca' }} />}
              />
              <Text style={{ color: '#bfdbfe', fontSize: '14px', marginTop: '8px', display: 'block' }}>
                {outOfStockCount} completely out of stock
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
                title="Low Stock Items"
                value={lowStockItems.length}
                valueStyle={{ color: '#fff', fontSize: '32px' }}
                prefix={<ShoppingOutlined style={{ color: '#fbcfe8' }} />}
              />
              <Text style={{ color: '#fbcfe8', fontSize: '14px', marginTop: '8px', display: 'block' }}>
                Items that need restocking soon
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
                title="Last Updated"
                value={new Date().toLocaleTimeString()}
                valueStyle={{ color: '#fff', fontSize: '24px' }}
                prefix={<ReloadOutlined style={{ color: '#bbf7d0' }} />}
              />
              <Text style={{ color: '#bbf7d0', fontSize: '14px', marginTop: '8px', display: 'block' }}>
                Click refresh to update data
              </Text>
          

            </Card>
          </Col>
        </Row>

        {/* Out of Stock Items Table */}
        <Card 
          style={{ 
            backgroundColor: '#2d3748', 
            borderColor: '#4a5568', 
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          title={
            <Space>
              <ExclamationCircleOutlined style={{ color: '#f87171', fontSize: '20px' }} />
              <Text strong style={{ color: '#f3f4f6', fontSize: '18px' }}>
                Out of Stock Items
              </Text>
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchOutOfStockItems}
              loading={loading}
              style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
            >
              Refresh
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={outOfStockItems}
            rowKey="product_id"
            loading={loading}
            pagination={{ 
              pageSize: 10,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              style: { color: '#9ca3af' }
            }}
            scroll={{ x: 'max-content' }}
            style={{ color: '#f3f4f6' }}
          />
        </Card>

        <Modal
          title={
            <Space>
              <ExclamationCircleOutlined style={{ color: '#3b82f6' }} />
              <span>Confirm Restock</span>
            </Space>
          }
          open={restockModalVisible}
          onOk={confirmRestock}
          onCancel={() => setRestockModalVisible(false)}
          confirmLoading={restocking}
          okText="Yes, Restock"
          cancelText="Cancel"
          okButtonProps={{ style: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' } }}
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ marginBottom: '8px' }}>
              Are you sure you want to restock <Text strong>{selectedProduct?.product_name}</Text>?
            </p>
            <p style={{ color: '#9ca3af', margin: 0 }}>
              This will mark the product as active in your inventory.
            </p>
          </div>
        </Modal>
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
    </div>
  );
};

export default StockPage;

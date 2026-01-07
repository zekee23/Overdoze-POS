import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  message, 
  Modal, 
  Row, 
  Col, 
  Statistic,
  Form,
  Input,
  Popconfirm,
  AutoComplete
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ReloadOutlined, 
  MenuOutlined, 
  UserOutlined, 
  LogoutOutlined,
  TeamOutlined,
  CrownOutlined
} from '@ant-design/icons';
import OverlaySidebar from '../../components/OverlaySidebar';
import api from '../../utils/api';
import '../Dashboard.css';
import './userpage.css';
import Toast from '../../components/common/Toast';

const { Title, Text } = Typography;

const UserPage = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [form] = Form.useForm();
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users...');
      const response = await api.get('/dashboard/users');
      console.log('Users response:', response.data);
      const sortedUsers = (response.data || []).sort((a, b) => a.uid - b.uid);
      setUsers(sortedUsers);
      message.success(`Successfully loaded ${sortedUsers.length} users`);
    } catch (error) {
      console.error('Fetch users error:', error);
      message.error(`Failed to load users: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);


  const handleCreate = () => {
    setEditingUser(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setModalVisible(true);

    form.setFieldsValue({
      username: user.username,
      full_name: user.full_name
    });
  };

  const handleDelete = async (userId) => {
    try {
      await api.delete(`/dashboard/users/${userId}`);
      message.success('User deleted successfully!');
      fetchUsers();
setToast({
  open: true,
  message: 'User Deleted successfully!',
  severity: 'success'
});
      // Hide toast after 2.5 seconds
      setTimeout(() => {
        setToast({ open: false, message: '', severity: 'success' });
      }, 2500);
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      if (editingUser) {
        await api.put(`/dashboard/users/${editingUser.uid}`, values);
        message.success('User updated successfully!');
        setModalVisible(false);
        form.resetFields();
        setEditingUser(null);
        setToast({
  open: true,
  message: 'User Updated successfully!',
  severity: 'success'
});
        fetchUsers();
      } else {
        // For creating new users, you might need to add a create endpoint
        message.success('User creation feature coming soon!');
        setModalVisible(false);
        form.resetFields();
      }
    } catch (error) {
      message.error(`Failed to ${editingUser ? 'update' : 'create'} user`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
   
    { 
      title: 'Username', 
      dataIndex: 'username', 
      key: 'username', 
      ellipsis: true,
      render: (text) => <Text style={{ color: '#f3f4f6' }}>{text}</Text>
    },
    { 
      title: 'Full Name', 
      dataIndex: 'full_name', 
      key: 'full_name', 
      ellipsis: true,
      render: (text) => <Text style={{ color: '#f3f4f6' }}>{text}</Text>
    },
  
    {
      title: 'Action',
      key: 'action',
      width: 150,
      fixed: 'right',
      onCell: () => ({ style: { backgroundColor: '#1f2937' } }),
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ 
              backgroundColor: '#10b981', 
              borderColor: '#10b981',
              fontWeight: 500,
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
              color: '#ffffff'
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this user?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.uid)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ style: { backgroundColor: '#ef4444', borderColor: '#ef4444' } }}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              style={{ 
                fontWeight: 500,
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                color: '#ffffff',
                backgroundColor: '#dc2626',
                borderColor: '#dc2626'
              }}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
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

        await fetchUsers();
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
      <div className="user-page" style={{
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

  const totalUsers = users.length;
  const adminUsers = users.filter(user => user.u_role === 'admin').length;
  const cashierUsers = users.filter(user => user.u_role === 'cashier').length;

  return (
    <div className="user-page" style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      padding: '0'
    }}>
      {/* Header */}
      <div className="user-header" style={{
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
              className="user-hamburger-menu-btn"
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
            />
            <Title level={3} style={{ margin: 0, color: '#3b82f6' }}>
              User Management
            </Title>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="user-info-display">
              <UserOutlined style={{ marginRight: '8px', color: '#3b82f6' }} />
              <Text strong style={{ color: '#f3f4f6' }}>
                {user?.full_name || user?.username || 'Admin'}
              </Text>
            </div>
            
            <Button 
              type="primary" 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className="user-logout-btn"
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
        <Card className="user-welcome" style={{ 
          marginBottom: '24px', 
          backgroundColor: 'rgba(45, 55, 72, 0.95)', 
          borderColor: '#4a5568', 
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={2} style={{ margin: 0, color: '#f3f4f6' }}>
                User Account Management
              </Title>
              <Text style={{ color: '#9ca3af' }}>
                Create, update, and manage user accounts and permissions
              </Text>
            </div>
          </div>
        </Card>


       

        {/* Users Table */}
        <Card 
          className="user-table-card"
          style={{ 
            backgroundColor: '#2d3748', 
            borderColor: '#4a5568', 
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          title={
            <Space>
              <TeamOutlined style={{ color: '#3b82f6', fontSize: '20px' }} />
              <Text strong style={{ color: '#f3f4f6', fontSize: '18px' }}>
                Users List
              </Text>
            </Space>
          }
          extra={
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchUsers}
                loading={loading}
                style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
              >
                Refresh
              </Button>
              
            </Space>
          }
        >
          <Table
            className="user-table"
            columns={columns}
            dataSource={users}
            rowKey="uid"
            loading={loading}
            pagination={{ 
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
              style: { color: '#9ca3af' }
            }}
            scroll={{ x: 'max-content' }}
            style={{ color: '#f3f4f6' }}
            rowHeight={55}
            size="small"
          />
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          className="dashboard-modal"
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editingUser ? <EditOutlined style={{ color: '#3b82f6', fontSize: '18px' }} /> : <PlusOutlined style={{ color: '#10b981', fontSize: '18px' }} />}
              <span style={{ color: '#f3f4f6', fontSize: '16px', fontWeight: 'bold' }}>
                {editingUser ? 'Edit User' : 'Create New User'}
              </span>
            </div>
          }
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
            setEditingUser(null);
          }}
          footer={null}
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
            onFinish={handleSubmit}
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: 'Please enter username' }]}
            >
              <Input placeholder="Enter username" style={{ backgroundColor: '#374151', borderColor: '#4b5563', color: '#f3f4f6', borderRadius: '6px' }} />
            </Form.Item>

            <Form.Item
              name="full_name"
              label="Full Name"
              rules={[{ required: true, message: 'Please enter full name' }]}
            >
              <Input placeholder="Enter full name" style={{ backgroundColor: '#374151', borderColor: '#4b5563', color: '#f3f4f6', borderRadius: '6px' }} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                  setEditingUser(null);
                  
                  
                }}>
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={submitting}
                  style={{ backgroundColor: editingUser ? '#3b82f6' : '#10b981', borderColor: editingUser ? '#3b82f6' : '#10b981' }}
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>

      {/* Mobile Sidebar */}
      <OverlaySidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <Toast
  open={toast.open}
  message={toast.message}
  severity={toast.severity}
  onClose={() => setToast({ ...toast, open: false })}
/>
      {sidebarOpen && (
        <div 
          className="user-mobile-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default UserPage;

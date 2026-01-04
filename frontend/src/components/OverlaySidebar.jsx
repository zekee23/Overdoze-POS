import React from 'react';
import { Menu, Button, Avatar, Typography, Space, Divider } from 'antd';
import { 
  DashboardOutlined, 
  ShoppingCartOutlined, 
  UserOutlined, 
  SettingOutlined, 
  BarChartOutlined,
  ProductOutlined,
  FileTextOutlined,
  LogoutOutlined,
  CloseOutlined
} from '@ant-design/icons';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useNavigate, useLocation } from 'react-router-dom';
import './OverlaySidebar.css';

const { Text } = Typography;

const OverlaySidebar = ({ isOpen, onClose, user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
   
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Home Dashboard',
    },
    {
      key: '/order-history',
      icon: <FileTextOutlined />,
      label: 'Order History',
    },
    {
      key: '/products',
      icon: <ProductOutlined />,
      label: 'Manage Products',
    },
    {
      key: '/stock-page',
      icon: <InventoryIcon />,
      label: 'Stock Inventory',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Monthly Sales Summary Reports',
    },
    {
      key: '/user-page',
      icon: <PeopleIcon />,
      label: 'View Users',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      localStorage.clear();
      navigate('/login');
    } else {
      navigate(key);
    }
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`sidebar-container ${isOpen ? 'open' : ''}`}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-logo">
              POS
            </div>
            <div className="brand-text">
              <div className="brand-title">Overdoze POS</div>
              <div className="brand-subtitle">Management System</div>
            </div>
          </div>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            className="sidebar-close-btn"
          />
        </div>

        {/* User Profile */}
        <div className="sidebar-profile">
          <div className="profile-info">
            <Avatar
              size="large"
              className="profile-avatar"
            >
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'A'}
            </Avatar>
            <div className="profile-details">
              <div className="profile-name">
                {user?.full_name || user?.username || 'Admin User'}
              </div>
              <div className="profile-role">
                {user?.u_role || 'Administrator'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="sidebar-menu">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            className="sidebar-nav-menu"
          />
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <Space orientation="vertical" size="small" style={{ width: '100%' }}>
            <div className="status-indicator">
              <span className="status-label">System Status</span>
              <div className="status-dot" />
            </div>
            <div className="version-info">
              Version 1.0.0 • All systems operational
            </div>
          </Space>
        </div>
      </div>
    </>
  );
};

export default OverlaySidebar;

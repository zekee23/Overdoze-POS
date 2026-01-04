import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';

const { Content } = Layout;

const MainLayout = ({ children, user }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-collapse on mobile
      if (mobile) {
        setCollapsed(true);
      }
    };

    const handleMobileSidebarToggle = () => {
      if (isMobile) {
        setCollapsed(!collapsed);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('toggleMobileSidebar', handleMobileSidebarToggle);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('toggleMobileSidebar', handleMobileSidebarToggle);
    };
  }, [isMobile, collapsed]);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Mobile overlay */}
      {isMobile && !collapsed && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 999,
            onClick: () => setCollapsed(true)
          }}
        />
      )}
      
      <Sidebar 
        collapsed={collapsed} 
        onCollapse={setCollapsed} 
        user={user}
        isMobile={isMobile}
      />
      
      <Layout style={{ 
        marginLeft: isMobile ? 0 : (collapsed ? 80 : 280), 
        transition: 'margin-left 0.2s',
        position: 'relative'
      }}>
        <Content style={{
          margin: 0,
          padding: 0,
          background: '#f5f5f5',
          overflow: 'auto',
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;

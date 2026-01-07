import { useEffect, useState } from 'react';
import { Card, Table, Typography, Tag, Space, Spin, Empty } from 'antd';
import { ClockCircleOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';
import { orderAPI } from '../utils/api';
import './RecentOrders.css';

const { Text, Title } = Typography;

const RecentOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    try {
      const response = await orderAPI.getRecentOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch recent orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
   
    {
      title: 'Date & Time',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
          <Text style={{ fontSize: '12px', color: '#9ca3af' }}>{formatDate(date)}</Text>
        </Space>
      ),
    },
    {
      title: 'Cashier',
      dataIndex: 'cashier_name',
      key: 'cashier_name',
      width: 120,
      render: (cashier) => (
        <Space>
          <UserOutlined style={{ color: '#8c8c8c' }} />
          <Text style={{ fontSize: '12px', color: '#d1d5db' }}>{cashier || 'Unknown'}</Text>
        </Space>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => (
        <div style={{ maxWidth: '300px' }}>
          {items?.map((item, index) => (
            <div key={index} style={{ marginBottom: '4px' }}>
              <Text style={{ fontSize: '12px', color: '#f3f4f6' }}>
                <strong>{item.product_name}</strong> ({item.size_label}) x {item.quantity}
              </Text>
              <br />
              <Text style={{ fontSize: '11px', color: '#9ca3af' }}>
                PHP {item.price_each} each = PHP {item.subtotal}
              </Text>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      align: 'right',
      render: (total) => (
        <Space>
  <Text strong style={{ color: '#10b981', fontSize: '14px' }}>
    ₱{Number(total).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
  </Text>
</Space>

      ),
    },
  ];

  if (loading) {
    return (
      <Card style={{ backgroundColor: '#2d3748', borderColor: '#4a5568', borderRadius: '12px' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="Recent Orders (Last 20)" 
      style={{ 
        backgroundColor: '#2d3748',
        borderColor: '#4a5568',
        borderRadius: '12px'
      }}
    >
      {orders.length === 0 ? (
        <Empty 
          description="No orders found" 
          style={{ padding: '40px' }}
          imageStyle={{ filter: 'brightness(0.5)' }}
        />
      ) : (
        <Table
          dataSource={orders}
          columns={columns}
          rowKey="order_id"
          pagination={false}
          scroll={{ y: 400 }}
          size="small"
          style={{
            fontSize: '12px'
          }}
          className="dark-theme-table"
          rowClassName={() => 'dark-table-row'}
          headerClassName="dark-table-header"
        />
      )}
    </Card>
  );
};

export default RecentOrders;

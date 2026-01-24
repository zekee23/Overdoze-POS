import { Modal, Table, Button, Typography, Space, Popconfirm } from 'antd';
import { 
  FilePdfOutlined, 
  EyeOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import { formatCurrency, formatDate, formatMonth } from '../../utils/formatters';
import { modalStyles } from '../../constants/styles';

const { Text } = Typography;

const ReportsModal = ({ 
  visible, 
  onCancel, 
  generatedReports, 
  onViewReport, 
  onDeleteReport 
}) => {
  const columns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      width: window.innerWidth <= 768 ? 120 : 150,
      render: (month) => (
        <Text style={{ color: '#333', fontSize: window.innerWidth <= 768 ? '12px' : '14px' }}>
          {month ? formatMonth(month, window.innerWidth <= 768 ? 'short' : 'long') : 'No month'}
        </Text>
      ),
    },
    ...(window.innerWidth > 768 ? [{
      title: 'Orders',
      dataIndex: 'total_orders',
      key: 'total_orders',
      width: 80,
      render: (orders) => (
        <Text style={{ color: '#333', fontSize: '14px' }}>
          {orders?.toLocaleString() || 0}
        </Text>
      ),
    }, {
      title: 'Gross Sales',
      dataIndex: 'gross_sales',
      key: 'gross_sales',
      width: 100,
      render: (sales) => (
        <Text style={{ color: '#333', fontSize: '14px' }}>
          {formatCurrency(sales || 0)}
        </Text>
      ),
    }, {
      title: 'Profit',
      dataIndex: 'profit',
      key: 'profit',
      width: 80,
      render: (profit) => (
        <Text style={{ 
          color: profit >= 0 ? '#10b981' : '#ef4444', 
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {formatCurrency(profit || 0)}
        </Text>
      ),
    }] : []),
    {
      title: window.innerWidth <= 768 ? 'Created' : 'Created Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: window.innerWidth <= 768 ? 80 : 120,
      render: (date) => (
        <Text style={{ color: '#333', fontSize: window.innerWidth <= 768 ? '11px' : '14px' }}>
          {formatDate(date, {
            month: 'short',
            day: 'numeric',
            year: '2-digit'
          })}
        </Text>
      ),
    },
    ...(window.innerWidth > 768 ? [{
      title: 'Created By',
      dataIndex: 'created_by_name',
      key: 'created_by_name',
      width: 100,
      render: (name) => (
        <Text style={{ color: '#333', fontSize: '14px' }}>
          {name || 'Unknown'}
        </Text>
      ),
    }] : []),
    {
      title: 'Actions',
      key: 'actions',
      width: window.innerWidth <= 768 ? 120 : 150,
      render: (_, record) => (
        <Space size={window.innerWidth <= 768 ? 'small' : 'middle'}>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onViewReport(record)}
            style={{ color: '#3b82f6' }}
            size={window.innerWidth <= 768 ? 'small' : 'middle'}
          >
            {window.innerWidth > 768 && 'View'}
          </Button>
          <Popconfirm
            title="Delete this report?"
            description="This action cannot be undone."
            onConfirm={() => onDeleteReport(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ style: { backgroundColor: '#dc2626' } }}
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              style={{ color: '#ef4444' }}
              size={window.innerWidth <= 768 ? 'small' : 'middle'}
            >
              {window.innerWidth > 768 && 'Delete'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FilePdfOutlined style={{ color: '#dc2626', fontSize: '18px' }} />
          <span style={{ color: '#f3f4f6', fontSize: '16px', fontWeight: 'bold' }}>
            Generated PDF Reports
          </span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          Close
        </Button>
      ]}
      width={window.innerWidth <= 768 ? '95%' : 800}
      centered
      styles={modalStyles}
    >
      <Table
        dataSource={generatedReports}
        rowKey="id"
        pagination={{ 
          pageSize: window.innerWidth <= 768 ? 5 : 10,
          simple: window.innerWidth <= 768
        }}
        scroll={{ x: window.innerWidth <= 768 ? 400 : undefined }}
        columns={columns}
        locale={{
          emptyText: (
            <div style={{ textAlign: 'center', padding: window.innerWidth <= 768 ? '20px' : '40px' }}>
              <FilePdfOutlined style={{ 
                fontSize: window.innerWidth <= 768 ? '32px' : '48px', 
                color: '#4b5563', 
                marginBottom: '16px' 
              }} />
              <Text style={{ color: '#9ca3af', display: 'block', fontSize: window.innerWidth <= 768 ? '14px' : '16px' }}>
                No saved reports yet
              </Text>
              <Text style={{ 
                color: '#6b7280', 
                fontSize: window.innerWidth <= 768 ? '11px' : '12px', 
                display: 'block', 
                marginTop: '8px' 
              }}>
                Save monthly reports for completed months with starting cash
              </Text>
            </div>
          )
        }}
      />
    </Modal>
  );
};

export default ReportsModal;

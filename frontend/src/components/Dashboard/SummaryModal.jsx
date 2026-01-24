import { Modal, Row, Col, Card, Statistic, Button, Typography, Space } from 'antd';
import { DownloadOutlined, CalendarOutlined, TrophyOutlined } from '@ant-design/icons';
import { formatCurrency, formatMonth } from '../../utils/formatters';
import { modalStyles } from '../../constants/styles';
import { generatePDFFromReport } from '../../utils/pdfGenerator';

const { Title, Text } = Typography;

const SummaryModal = ({ 
  visible, 
  onCancel, 
  dashboardData, 
  selectedMonth, 
  user 
}) => {
  const handleDownloadPDF = () => {
    generatePDFFromReport({
      month: selectedMonth,
      total_orders: dashboardData.total_orders,
      gross_sales: dashboardData.gross_sales,
      starting_cash: dashboardData.starting_cash,
      profit: dashboardData.profit,
      top_products: dashboardData.top_products,
      created_by_name: user?.username || 'Unknown',
      created_at: new Date().toISOString()
    });
  };

  const topProductsCards = dashboardData?.top_products?.map((product, index) => ({
    rank: index + 1,
    ...product
  })) || [];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarOutlined style={{ color: '#3b82f6', fontSize: '18px' }} />
          <span style={{ color: '#f3f4f6', fontSize: '16px', fontWeight: 'bold' }}>
            Monthly Summary Report
          </span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPDF}>
          Download Report
        </Button>,
        <Button key="close" onClick={onCancel}>
          Close
        </Button>
      ]}
      width={600}
      centered
      styles={modalStyles}
    >
      {dashboardData && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <Text strong style={{ color: '#3b82f6', fontSize: '16px' }}>
              {formatMonth(selectedMonth, 'long')}
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
                  formatter={formatCurrency}
                  valueStyle={{ color: '#fff' }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" style={{ backgroundColor: '#1f2937', border: 'none' }}>
                <Statistic
                  title="Starting Cash"
                  value={dashboardData.starting_cash === null || dashboardData.starting_cash === undefined ? 'No starting cash' : dashboardData.starting_cash}
                  formatter={(value) => {
                    if (typeof value === 'string' && value === 'No starting cash') {
                      return value;
                    }
                    return formatCurrency(value);
                  }}
                  valueStyle={{ 
                    color: dashboardData.starting_cash === null || dashboardData.starting_cash === undefined ? '#fbbf24' : '#fff'
                  }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" style={{ backgroundColor: '#1f2937', border: 'none' }}>
                <Statistic
                  title="Profit"
                  value={dashboardData.profit}
                  formatter={formatCurrency}
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
  );
};

export default SummaryModal;

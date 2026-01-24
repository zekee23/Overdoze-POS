import { Row, Col, Card, Typography } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../utils/formatters';

const { Title, Text } = Typography;

const TopProducts = ({ topProducts }) => {
  const topProductsCards = topProducts?.map((product, index) => ({
    rank: index + 1,
    ...product
  })) || [];

  return (
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
          <TrophyOutlined style={{ color: '#3b82f6', fontSize: '20px', marginRight: '8px' }} />
          <Text strong style={{ color: '#f3f4f6', fontSize: '18px', fontWeight: '600' }}>
            Top 3 Products by Revenue
          </Text>
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
              <div style={{ marginBottom: '12px' }} className="trophy-icon">
                <TrophyOutlined 
                  className={
                    index === 0 ? 'trophy-gold' : 
                    index === 1 ? 'trophy-silver' : 
                    'trophy-bronze'
                  }
                  style={{ fontSize: '24px' }}
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
                  Units Sold: {product.total_sold?.toLocaleString() || 0}
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
  );
};

export default TopProducts;

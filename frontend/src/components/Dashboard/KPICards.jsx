import { Row, Col, Card, Statistic, Typography } from 'antd';
import { ShoppingCartOutlined, RiseOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../utils/formatters';

const { Text } = Typography;

const KPICards = ({ dashboardData }) => {
  const kpiData = [
    {
      title: 'Total Orders',
      value: dashboardData?.total_orders || 0,
      prefix: <ShoppingCartOutlined style={{ color: '#bfdbfe' }} />,
      backgroundColor: '#1e40af',
      subtitle: 'Orders this month',
      subtitleColor: '#bfdbfe'
    },
    {
      title: 'Gross Sales',
      value: dashboardData?.gross_sales || 0,
      formatter: formatCurrency,
      backgroundColor: '#9d174d',
      subtitle: 'Total revenue',
      subtitleColor: '#fbcfe8'
    },
    {
      title: 'Starting Cash',
      value: dashboardData?.starting_cash === null || dashboardData?.starting_cash === undefined 
        ? 'No starting cash' 
        : dashboardData?.starting_cash,
      formatter: (value) => {
        if (typeof value === 'string' && value === 'No starting cash') {
          return value;
        }
        return formatCurrency(value);
      },
      backgroundColor: '#7c3aed',
      subtitle: 'Initial cash amount',
      subtitleColor: '#e9d5ff',
      valueStyle: {
        color: dashboardData?.starting_cash === null || dashboardData?.starting_cash === undefined ? '#fbbf24' : '#fff',
        fontSize: dashboardData?.starting_cash === null || dashboardData?.starting_cash === undefined ? '20px' : '32px'
      }
    },
    {
      title: 'Profit',
      value: dashboardData?.profit || 0,
      formatter: formatCurrency,
      prefix: <RiseOutlined style={{ color: dashboardData?.profit >= 0 ? '#10b981' : '#ef4444' }} />,
      backgroundColor: dashboardData?.profit >= 0 ? '#065f46' : '#991b1b',
      subtitle: 'Net profit',
      subtitleColor: dashboardData?.profit >= 0 ? '#bbf7d0' : '#fecaca',
      valueStyle: {
        fontSize: '32px',
        fontWeight: 'bold'
      }
    }
  ];

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
      {kpiData.map((kpi, index) => (
        <Col xs={24} sm={12} lg={6} key={kpi.title}>
          <Card 
            style={{ 
              backgroundColor: kpi.backgroundColor, 
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Statistic
              title={kpi.title}
              value={kpi.value}
              formatter={kpi.formatter}
              valueStyle={{ 
                color: '#fff', 
                fontSize: '32px',
                ...kpi.valueStyle
              }}
              prefix={kpi.prefix}
            />
            <Text style={{ 
              color: kpi.subtitleColor, 
              fontSize: '14px', 
              marginTop: '8px', 
              display: 'block' 
            }}>
              {kpi.subtitle}
            </Text>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default KPICards;

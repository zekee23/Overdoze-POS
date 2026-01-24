import { Modal, Row, Col, Card, Button, Typography, Space } from 'antd';
import { DownloadOutlined, CalendarOutlined } from '@ant-design/icons';
import { formatCurrency, formatDate, formatMonth } from '../../utils/formatters';
import { modalStyles } from '../../constants/styles';
import { generatePDFFromReport } from '../../utils/pdfGenerator';

const { Title, Text } = Typography;

const ReportViewModal = ({ 
  visible, 
  onCancel, 
  selectedReport 
}) => {
  const handleDownloadPDF = () => {
    if (selectedReport) {
      generatePDFFromReport(selectedReport);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarOutlined style={{ color: '#3b82f6', fontSize: '18px' }} />
          <span style={{ color: '#f3f4f6', fontSize: '16px', fontWeight: 'bold' }}>
            Monthly Report Details
          </span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button 
          key="download" 
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownloadPDF}
          style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
        >
          Download PDF
        </Button>,
        <Button key="close" onClick={onCancel}>
          Close
        </Button>
      ]}
      width={window.innerWidth <= 768 ? '95%' : 700}
      centered
      styles={modalStyles}
    >
      {selectedReport && (
        <div>
          {/* Report Header */}
          <div style={{ 
            marginBottom: '24px', 
            padding: '16px', 
            backgroundColor: '#1f2937', 
            borderRadius: '8px',
            border: '1px solid #374151'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={4} style={{ color: '#f3f4f6', margin: 0 }}>
                  {formatMonth(selectedReport.month, 'long')}
                </Title>
                <Text style={{ color: '#9ca3af', fontSize: '14px' }}>
                  Created on {formatDate(selectedReport.created_at)} by {selectedReport.created_by_name}
                </Text>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={12} sm={6}>
              <Card style={{ 
                backgroundColor: '#1e40af', 
                border: 'none',
                borderRadius: '8px',
                textAlign: 'center',
                height: '100%'
              }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '80px',
                  color: '#fff' 
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', lineHeight: '1.2' }}>
                    {selectedReport.total_orders?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#bfdbfe', marginTop: '4px' }}>Total Orders</div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ 
                backgroundColor: '#9d174d', 
                border: 'none',
                borderRadius: '8px',
                textAlign: 'center',
                height: '100%'
              }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '80px',
                  color: '#fff' 
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', lineHeight: '1.2' }}>
                    {formatCurrency(selectedReport.gross_sales || 0)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#fbcfe8', marginTop: '4px' }}>Gross Sales</div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ 
                backgroundColor: '#7c3aed', 
                border: 'none',
                borderRadius: '8px',
                textAlign: 'center',
                height: '100%'
              }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '80px',
                  color: '#fff' 
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', lineHeight: '1.2' }}>
                    {formatCurrency(selectedReport.starting_cash || 0)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#e9d5ff', marginTop: '4px' }}>Starting Cash</div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ 
                backgroundColor: selectedReport.profit >= 0 ? '#065f46' : '#991b1b', 
                border: 'none',
                borderRadius: '8px',
                textAlign: 'center',
                height: '100%'
              }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '80px',
                  color: '#fff' 
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', lineHeight: '1.2' }}>
                    {formatCurrency(selectedReport.profit || 0)}
                  </div>
                  <div style={{ fontSize: '12px', color: selectedReport.profit >= 0 ? '#bbf7d0' : '#fecaca', marginTop: '4px' }}>
                    Profit
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Top Products */}
          {selectedReport.top_products && selectedReport.top_products.length > 0 && (
            <div>
              <Title level={5} style={{ color: '#f3f4f6', marginBottom: '16px' }}>
                Top 3 Products
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedReport.top_products.map((product, index) => (
                  <Card key={index} style={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: index === 0 ? '#1e40af' : index === 1 ? '#7c3aed' : '#9d174d',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          flexShrink: 0
                        }}>
                          {index + 1}
                        </div>
                        <div>
                          <Text style={{ color: '#f3f4f6', fontSize: '14px', fontWeight: 'bold', display: 'block' }}>
                            {product.product_name}
                          </Text>
                          <Text style={{ color: '#9ca3af', fontSize: '12px', display: 'block' }}>
                            {product.total_sold?.toLocaleString() || 0} units sold
                          </Text>
                        </div>
                      </div>
                      <Text style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        {formatCurrency(product.total_revenue || 0)}
                      </Text>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ReportViewModal;

import { Card, Typography, Button, Space } from 'antd';
import { 
  EyeOutlined, 
  DownloadOutlined, 
  SaveOutlined, 
  FilePdfOutlined, 
  PlusOutlined,
  CalendarOutlined 
} from '@ant-design/icons';
import { formatMonth } from '../../utils/formatters';
import { generatePDFFromReport } from '../../utils/pdfGenerator';

const { Text } = Typography;

const MonthlySummary = ({ 
  dashboardData, 
  selectedMonth, 
  user, 
  canSaveReport, 
  canGeneratePDF,
  saveReportLoading,
  pdfLoading,
  onViewSummary,
  onSaveReport,
  onGeneratePDF,
  onOpenReports
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

  const hasStartingCash = dashboardData?.starting_cash !== null && dashboardData?.starting_cash !== undefined;

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
          <Text strong style={{ color: '#f3f4f6', fontSize: '18px', fontWeight: '600' }}>
            Monthly Summary
          </Text>
        </div>
      }
      extra={
        hasStartingCash ? (
          <Space size="small" wrap>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={onViewSummary}
              style={{ color: '#3b82f6' }}
              size="small"
            >
              <span style={{ display: window.innerWidth <= 768 ? 'none' : 'inline' }}>View</span>
            </Button>
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={handleDownloadPDF}
              style={{ color: '#10b981' }}
              size="small"
            >
              <span style={{ display: window.innerWidth <= 768 ? 'none' : 'inline' }}>Download</span>
            </Button>
            {canSaveReport && (
              <Button
                type="text"
                icon={<SaveOutlined />}
                onClick={onSaveReport}
                loading={saveReportLoading}
                style={{ color: '#f59e0b' }}
                size="small"
              >
                <span style={{ display: window.innerWidth <= 768 ? 'none' : 'inline' }}>Save</span>
              </Button>
            )}
            {canGeneratePDF && (
              <Button
                type="text"
                icon={<FilePdfOutlined />}
                onClick={onGeneratePDF}
                loading={pdfLoading}
                style={{ color: '#dc2626' }}
                size="small"
              >
                <span style={{ display: window.innerWidth <= 768 ? 'none' : 'inline' }}>PDF</span>
              </Button>
            )}
            <Button
              type="text"
              icon={<PlusOutlined />}
              onClick={onOpenReports}
              style={{ color: '#8b5cf6' }}
              size="small"
            >
              <span style={{ display: window.innerWidth <= 768 ? 'none' : 'inline' }}>Reports</span>
            </Button>
          </Space>
        ) : (
          <Space size="small" wrap>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={onViewSummary}
              style={{ color: '#3b82f6' }}
              size="small"
            >
              <span style={{ display: window.innerWidth <= 768 ? 'none' : 'inline' }}>View</span>
            </Button>
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={handleDownloadPDF}
              style={{ color: '#10b981' }}
              size="small"
            >
              <span style={{ display: window.innerWidth <= 768 ? 'none' : 'inline' }}>Download</span>
            </Button>
            <Button
              type="primary"
              onClick={onSaveReport}
              loading={saveReportLoading}
              disabled={!canSaveReport}
              style={{ 
                backgroundColor: canSaveReport ? '#10b981' : '#6b7280', 
                borderColor: canSaveReport ? '#10b981' : '#6b7280',
                marginRight: window.innerWidth <= 768 ? '0' : '8px'
              }}
            >
              <SaveOutlined style={{ marginRight: '8px' }} />
              <span>Save Monthly Report</span>
            </Button>
            {canGeneratePDF && (
              <Button
                type="text"
                icon={<FilePdfOutlined />}
                onClick={onGeneratePDF}
                loading={pdfLoading}
                style={{ color: '#dc2626' }}
                size="small"
              >
                <span style={{ display: window.innerWidth <= 768 ? 'none' : 'inline' }}>PDF</span>
              </Button>
            )}
            <Button
              type="text"
              icon={<PlusOutlined />}
              onClick={onOpenReports}
              style={{ color: '#8b5cf6' }}
              size="small"
            >
              <span style={{ display: window.innerWidth <= 768 ? 'none' : 'inline' }}>Reports</span>
            </Button>
          </Space>
        )
      }
    >
      <div style={{ textAlign: 'center', padding: window.innerWidth <= 768 ? '16px 0' : '20px 0' }}>
        <div style={{
          width: window.innerWidth <= 768 ? '50px' : '60px',
          height: window.innerWidth <= 768 ? '50px' : '60px',
          backgroundColor: hasStartingCash ? '#3b82f6' : '#ef4444',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto ' + (window.innerWidth <= 768 ? '12px' : '16px')
        }}>
          <CalendarOutlined style={{ fontSize: window.innerWidth <= 768 ? '20px' : '24px', color: '#fff' }} />
        </div>
        <Text style={{ 
          color: '#9ca3af', 
          fontSize: window.innerWidth <= 768 ? '12px' : '14px', 
          display: 'block', 
          marginBottom: '8px' 
        }}>
          {formatMonth(selectedMonth, window.innerWidth <= 768 ? 'short' : 'long')}
        </Text>
        <Text strong style={{ 
          color: hasStartingCash ? '#f3f4f6' : '#ef4444', 
          fontSize: window.innerWidth <= 768 ? '14px' : '16px',
          lineHeight: window.innerWidth <= 768 ? '1.3' : '1.4'
        }}>
          {hasStartingCash 
            ? 'Complete monthly report available' 
            : 'No starting cash set'
          }
        </Text>
      </div>
    </Card>
  );
};

export default MonthlySummary;

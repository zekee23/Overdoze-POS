import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Typography, 
  Button, 
  Space,
  DatePicker,
  Form,
  message
} from 'antd';
import { 
  MenuOutlined,
  UserOutlined,
  LogoutOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

// Custom hooks
import { useAuth } from '../../hooks/useAuth';
import { useDashboardData } from '../../hooks/useDashboardData';
import { usePDFReports } from '../../hooks/usePDFReports';

// Components
import KPICards from '../../components/Dashboard/KPICards';
import TopProducts from '../../components/Dashboard/TopProducts';
import MonthlySummary from '../../components/Dashboard/MonthlySummary';
import SetCashModal from '../../components/Dashboard/SetCashModal';
import SummaryModal from '../../components/Dashboard/SummaryModal';
import ReportsModal from '../../components/Dashboard/ReportsModal';
import ReportViewModal from '../../components/Dashboard/ReportViewModal';
import OverlaySidebar from '../../components/OverlaySidebar';

// Utils and constants
import { dashboardAPI } from '../../api/dashboard';
import { isMonthEnded, canGeneratePDF, canSaveReport } from '../../utils/validators';
import { cardStyles } from '../../constants/styles';
import '../Dashboard.css';

const { Title, Text } = Typography;

const MonthlyDashboard = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [cashModalVisible, setCashModalVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [form] = Form.useForm();
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [pdfReportsModalVisible, setPdfReportsModalVisible] = useState(false);
  const [reportViewModalVisible, setReportViewModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Custom hooks
  const { user, authLoading, handleLogout } = useAuth();
  const { loading, dashboardData, handleRefresh } = useDashboardData(selectedMonth, authLoading);
  const {
    pdfLoading,
    saveReportLoading,
    generatedReports,
    fetchGeneratedReports,
    handleGeneratePDF,
    handleDeleteReport,
    handleSaveMonthlyReport
  } = usePDFReports();

  // Memoized values
  const canGeneratePDFValue = useMemo(() => 
    canGeneratePDF(selectedMonth, dashboardData), 
    [selectedMonth, dashboardData]
  );

  const canSaveReportValue = useMemo(() => 
    canSaveReport(selectedMonth, dashboardData), 
    [selectedMonth, dashboardData]
  );

  // Event handlers
  const handleMonthChange = useCallback((value) => {
    if (value) {
      setSelectedMonth(value.format('YYYY-MM'));
    }
  }, []);

  const handleSetStartingCash = async (values) => {
    try {
      await dashboardAPI.setMonthlyCash(selectedMonth, values.startingCash);
      message.success('Starting cash set successfully');
      setCashModalVisible(false);
      form.resetFields();
      handleRefresh();
    } catch (error) {
      message.error('Failed to set starting cash');
      console.error('Set cash error:', error);
    }
  };

  const openPDFReportsModal = async () => {
    await fetchGeneratedReports();
    setPdfReportsModalVisible(true);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setReportViewModalVisible(true);
  };

  const handleCloseReportView = () => {
    setReportViewModalVisible(false);
    setSelectedReport(null);
  };

  if (authLoading) {
    return (
      <div className="dashboard-dark" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f172a'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ marginBottom: '16px' }} />
          <Text style={{ color: '#9ca3af' }}>Loading...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-dark" style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      padding: '0'
    }}>
      {/* Header */}
      <div style={{
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
              className="hamburger-menu-btn"
            />
            <Title level={3} style={{ margin: 0, color: '#3b82f6' }}>
              Monthly Dashboard
            </Title>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              backgroundColor: '#374151',
              padding: '8px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #4b5563'
            }}>
              <UserOutlined style={{ marginRight: '8px', color: '#3b82f6' }} />
              <Text strong style={{ color: '#f3f4f6' }}>
                {user?.full_name || user?.username || 'Admin'}
              </Text>
            </div>
            
            <Button 
              type="primary" 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
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
        <Card style={{ 
          marginBottom: '24px', 
          ...cardStyles.base
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{
                  width: '4px',
                  height: '32px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '2px',
                  marginRight: '12px'
                }} />
                <Title level={2} style={{ margin: 0, color: '#f3f4f6', fontWeight: '600' }}>
                  Monthly Performance Overview
                </Title>
              </div>
              <Text style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.4', marginLeft: '16px' }}>
                Track and analyze your monthly sales metrics and top performing products
              </Text>
            </div>
            
            <Space>
              <DatePicker
                picker="month"
                value={dayjs(selectedMonth)}
                onChange={handleMonthChange}
                allowClear={false}
                size="middle"
                disabledDate={(current) => {
                  if (!current) return false;
                  const now = dayjs();
                  return current.isAfter(now, 'month');
                }}
                style={{
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '8px',
                  color: '#f3f4f6'
                }}
                popupClassName="dark-datepicker"
              />

              <Button 
                type="primary" 
                onClick={() => setCashModalVisible(true)}
                style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
              >
                Set Starting Cash
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
                style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
              >
                Refresh
              </Button>
            </Space>
          </div>
        </Card>

        {dashboardData && (
          <>
            {/* KPI Cards */}
            <KPICards dashboardData={dashboardData} />

            {/* Top Products Cards and Monthly Summary */}
            <div style={{ display: 'flex', gap: '16px', flexDirection: 'row', flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 300 }}>
                <TopProducts topProducts={dashboardData.top_products} />
              </div>
              <div style={{ flex: 1, minWidth: 280 }}>
                <MonthlySummary
                  dashboardData={dashboardData}
                  selectedMonth={selectedMonth}
                  user={user}
                  canSaveReport={canSaveReportValue}
                  canGeneratePDF={canGeneratePDFValue}
                  saveReportLoading={saveReportLoading}
                  pdfLoading={pdfLoading}
                  onViewSummary={() => setSummaryModalVisible(true)}
                  onSaveReport={() => handleSaveMonthlyReport(selectedMonth, canSaveReportValue)}
                  onGeneratePDF={() => handleGeneratePDF(selectedMonth, canGeneratePDFValue)}
                  onOpenReports={openPDFReportsModal}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <SetCashModal
        visible={cashModalVisible}
        onCancel={() => setCashModalVisible(false)}
        onSubmit={handleSetStartingCash}
        form={form}
      />

      <SummaryModal
        visible={summaryModalVisible}
        onCancel={() => setSummaryModalVisible(false)}
        dashboardData={dashboardData}
        selectedMonth={selectedMonth}
        user={user}
      />

      <ReportsModal
        visible={pdfReportsModalVisible}
        onCancel={() => setPdfReportsModalVisible(false)}
        generatedReports={generatedReports}
        onViewReport={handleViewReport}
        onDeleteReport={handleDeleteReport}
      />

      <ReportViewModal
        visible={reportViewModalVisible}
        onCancel={handleCloseReportView}
        selectedReport={selectedReport}
      />

      {/* Mobile Sidebar */}
      <OverlaySidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />
      {sidebarOpen && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: window.innerWidth <= 768 ? 'block' : 'none'
          }}
        />
      )}
    </div>
  );
};

export default MonthlyDashboard;

import { useState, useCallback } from 'react';
import { message } from 'antd';
import { dashboardAPI } from '../api/dashboard';

export const usePDFReports = () => {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [saveReportLoading, setSaveReportLoading] = useState(false);
  const [generatedReports, setGeneratedReports] = useState([]);

  const fetchGeneratedReports = useCallback(async () => {
    try {
      const response = await dashboardAPI.getSavedReports();
      setGeneratedReports(response.reports || []);
    } catch (error) {
      message.error('Failed to fetch saved reports');
      console.error('Fetch reports error:', error);
    }
  }, []);

  const handleGeneratePDF = useCallback(async (month, canGeneratePDF) => {
    if (!canGeneratePDF) {
      message.error('PDF can only be generated for completed months with starting cash');
      return;
    }

    setPdfLoading(true);
    try {
      await dashboardAPI.generateMonthlyPDF(month);
      message.success('PDF generated successfully');
      await fetchGeneratedReports();
    } catch (error) {
      message.error('Failed to generate PDF');
      console.error('PDF generation error:', error);
    } finally {
      setPdfLoading(false);
    }
  }, [fetchGeneratedReports]);

  const handleDownloadPDF = useCallback(async (month) => {
    try {
      await dashboardAPI.downloadMonthlyPDF(month);
      message.success('PDF downloaded successfully');
    } catch (error) {
      message.error('Failed to download PDF');
      console.error('PDF download error:', error);
    }
  }, []);

  const handleDeleteReport = useCallback(async (reportId) => {
    try {
      await dashboardAPI.deleteSavedReport(reportId);
      message.success('Report deleted successfully');
      await fetchGeneratedReports();
    } catch (error) {
      message.error('Failed to delete report');
      console.error('Report deletion error:', error);
    }
  }, [fetchGeneratedReports]);

  const handleSaveMonthlyReport = useCallback(async (month, canSaveReport) => {
    if (!canSaveReport) {
      message.error('Report can only be saved for completed months with starting cash');
      return;
    }

    setSaveReportLoading(true);
    try {
      await dashboardAPI.saveMonthlyReport(month);
      message.success('Monthly report saved successfully');
      await fetchGeneratedReports();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to save monthly report');
      console.error('Save report error:', error);
    } finally {
      setSaveReportLoading(false);
    }
  }, [fetchGeneratedReports]);

  return {
    pdfLoading,
    saveReportLoading,
    generatedReports,
    fetchGeneratedReports,
    handleGeneratePDF,
    handleDownloadPDF,
    handleDeleteReport,
    handleSaveMonthlyReport
  };
};

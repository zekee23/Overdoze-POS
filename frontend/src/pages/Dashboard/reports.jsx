import React, { Suspense } from 'react';
const MonthlyDashboard = React.lazy(() => import('./MonthlyDashboard.jsx'));

const ReportsPage = () => {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f172a'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ marginBottom: '16px' }} />
          <div style={{ color: '#9ca3af' }}>Loading dashboard...</div>
        </div>
      </div>
    }>
      <MonthlyDashboard />
    </Suspense>
  );
};

export default ReportsPage;

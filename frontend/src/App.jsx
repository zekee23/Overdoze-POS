import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoadingSpinner from './components/common/LoadingSpinner';
import { analyzeBundleSize } from './utils/bundleAnalyzer';

const LandingPage = lazy(() => import('./pages/landingpage_clean'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const POS = lazy(() => import('./pages/POS.jsx'));
const ForgotPassword = lazy(() => import('./pages/forgotpassword.jsx'));
const ResetPassword = lazy(() => import('./pages/resetpassword.jsx'));
const StockPage = lazy(() => import('./pages/Dashboard/stockpage.jsx'));
const OrderHistory = lazy(() => import('./pages/Dashboard/OrderHistory.jsx'));
const ProductPage = lazy(() => import('./pages/Dashboard/productpage.jsx'));
const UserPage = lazy(() => import('./pages/Dashboard/userpage.jsx'));
const ReportsPage = lazy(() => import('./pages/Dashboard/reports.jsx'));
function App() {
  useEffect(() => {
    // Analyze bundle size in development
    if (import.meta.env.DEV) {
      setTimeout(analyzeBundleSize, 2000);
    }
  }, []);

  return (
     <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/stock-page" element={<StockPage />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/user-page" element={<UserPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;

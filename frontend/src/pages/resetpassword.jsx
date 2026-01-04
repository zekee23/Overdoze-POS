// In frontend/src/pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { validationUtils, securityUtils } from '../utils/auth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Toast from '../components/common/Toast';
import './Login.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setError('Invalid reset link. Please request a new password reset link.');
    }
    setToken(tokenFromUrl || '');
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords
    if (!validationUtils.isValidPin(securityUtils.sanitizeInput(newPassword))) {
      setError('Password must be 4-6 digits');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({ 
        token, 
        newPassword: securityUtils.sanitizeInput(newPassword) 
      });
      
      setSuccess(true);
      setToast({
        open: true,
        message: 'Password has been reset successfully. You can now login with your new password.',
        severity: 'success'
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to reset password');
      setToast({
        open: true,
        message: error.response?.data?.error || 'Failed to reset password',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToastClose = () => {
    setToast({ ...toast, open: false });
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-brand">⚠️ Error</div>
            <h1 className="login-title">Invalid Reset Link</h1>
            <p className="login-subtitle">
              The password reset link is invalid or has expired.
            </p>
          </div>
          <div className="login-footer">
            <button 
              className="back-to-login"
              onClick={() => navigate('/forgot-password')}
            >
              Request a new reset link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-brand">🔑 Reset Password</div>
          <h1 className="login-title">Create New Password</h1>
          <p className="login-subtitle">
            {success 
              ? 'Password reset successful! Redirecting to login...' 
              : 'Enter your new password below'}
          </p>
        </div>

        {!success ? (
          <form className="login-form" onSubmit={handleSubmit}>
            {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
            
            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">New Password</label>
              <input
                type="password"
                id="newPassword"
                className="form-input"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
              <small className="form-hint">Must be 4-6 digits</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                className="form-input"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="small" /> : 'Reset Password'}
            </button>
          </form>
        ) : (
          <div className="success-message">
            <p>Your password has been successfully updated.</p>
            <p>You will be redirected to the login page shortly.</p>
          </div>
        )}

        <div className="login-footer">
          <button 
            className="back-to-login"
            onClick={() => navigate('/login')}
            disabled={loading}
          >
            ← Back to Login
          </button>
        </div>
      </div>

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={handleToastClose}
      />
    </div>
  );
};

export default ResetPassword;
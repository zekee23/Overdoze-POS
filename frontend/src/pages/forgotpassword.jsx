import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { validationUtils, securityUtils } from '../utils/auth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Toast from '../components/common/Toast';
import './Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate email
    if (!validationUtils.isValidEmail(securityUtils.sanitizeInput(email))) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await authAPI.requestPasswordReset({ email });
      setSuccess(true);
      setToast({
        open: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
        severity: 'success'
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to process your request');
      setToast({
        open: true,
        message: error.response?.data?.error || 'Failed to process your request',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToastClose = () => {
    setToast({ ...toast, open: false });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-brand">🔒 Forgot Password</div>
          <h1 className="login-title">Reset Your Password</h1>
          <p className="login-subtitle">
            {success 
              ? 'Check your email for the password reset link' 
              : 'Enter your email address and we\'ll send you a link to reset your password'}
          </p>
        </div>

        {!success ? (
          <form className="login-form" onSubmit={handleSubmit}>
            {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" inline />
                  <span>Sending...</span>
                </>
              ) : (
                '📧 Send Reset Link'
              )}
            </button>
          </form>
        ) : (
          <div className="success-message">
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>✉️</div>
            <p style={{ fontWeight: '600', marginBottom: '10px' }}>
              Check your email!
            </p>
            <p>We've sent password reset instructions to:</p>
            <p style={{ fontWeight: '600', color: '#8b4513', marginTop: '5px' }}>{email}</p>
            <p style={{ marginTop: '15px', fontSize: '13px', opacity: 0.8 }}>
              Don't see the email? Check your spam folder or try again in a few minutes.
            </p>
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

export default ForgotPassword;
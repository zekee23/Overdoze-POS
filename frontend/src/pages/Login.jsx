import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { authUtils, validationUtils, securityUtils } from '../utils/auth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Toast from '../components/common/Toast';
import './Login.css';
import '../components/common/Toast.css';

const loginpage = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  // Form validation
  const validateForm = () => {
    // Sanitize input
    const sanitizedUsername = securityUtils.sanitizeInput(username);
    
    if (!validationUtils.isValidUsername(sanitizedUsername)) {
      setError('Username must be 3-20 characters (letters, numbers, underscore)');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      // Login API call - username only
      const response = await authAPI.login({
        username: securityUtils.sanitizeInput(username)
      });
      
      // Store token and user data using auth utils
      authUtils.setAuthData(response.data.token, response.data.user);
      setToast({ open: true, message: 'Login successful!', severity: 'success' });
      
      // Redirect based on user role
      const userRole = response.data.user.u_role;
      setTimeout(() => {
        if (userRole === 'admin') {
          navigate('/dashboard');
          sessionStorage.setItem('token', response.data.token);
          sessionStorage.setItem('user', JSON.stringify(response.data.user));
        } else {
          navigate('/pos');
        }
      }, 800);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
      setToast({ open: true, message: err.response?.data?.error || 'Authentication failed', severity: 'error' });
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
          <div className="login-brand">☕ Overdoze POS</div>
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">
            Enter your username to access the POS system
          </p>
        </div>

        {loading ? (
          <div className="loading-container">
            <LoadingSpinner size="large" />
            <p>Please wait...</p>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
            
            <div className="form-group">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                type="text"
                id="username"
                className="form-input"
                placeholder="Your username"
                value={username}
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" inline />
                  <span>Signing in...</span>
                </>
              ) : (
                '🚀 Sign In'
              )}
            </button>
          </form>
        )}

        <div className="login-footer">
          <button 
            className="back-button" 
            onClick={() => navigate('/')}
            disabled={loading}
          >
            ← Back to Home
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

export default loginpage;
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { authUtils, validationUtils, securityUtils } from '../utils/auth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Toast from '../components/common/Toast';
import Modal from '../components/common/Modal';
import './Login.css';
import '../components/common/Toast.css';

const loginpage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [pendingReg, setPendingReg] = useState(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState(60); // 1 minute in seconds
  const [otpExpired, setOtpExpired] = useState(false);
  const otpTimerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Form validation
  const validateForm = () => {
    // Sanitize inputs
    const sanitizedUsername = securityUtils.sanitizeInput(username);
    const sanitizedPassword = securityUtils.sanitizeInput(password);
    
    if (!validationUtils.isValidUsername(sanitizedUsername)) {
      setError('Username must be 3-20 characters (letters, numbers, underscore)');
      return false;
    }
    
    if (!validationUtils.isValidPin(sanitizedPassword)) {
      setError('PIN must be 4-6 digits');
      return false;
    }
    
    if (!isLogin) {
      const sanitizedName = securityUtils.sanitizeInput(name);
      const sanitizedEmail = securityUtils.sanitizeInput(email);
      
      if (!validationUtils.isValidName(sanitizedName)) {
        setError('Name must be 2-50 characters (letters and spaces only)');
        return false;
      }
      
      if (!validationUtils.isValidEmail(sanitizedEmail)) {
        setError('Please enter a valid email address');
        return false;
      }
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
      if (isLogin) {
        // Login API call
        const response = await authAPI.login({
          username: securityUtils.sanitizeInput(username),
          pin: securityUtils.sanitizeInput(password)
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
      } else {
        // Step 1: Send OTP to email
        setLoading(true);
        try {
          const regPayload = {
            username: securityUtils.sanitizeInput(username),
            email: securityUtils.sanitizeInput(email),
            pin: securityUtils.sanitizeInput(password),
            full_name: securityUtils.sanitizeInput(name)
          };
          await authAPI.sendOTP(regPayload.email);
          setPendingReg(regPayload);
          setOtp('');
          setOtpTimeLeft(60); // Reset to 1 minute
          setOtpExpired(false);
          setOtpModalOpen(true);
          setToast({ open: true, message: 'OTP sent to your email!', severity: 'success' });
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to send OTP');
          setToast({ open: true, message: err.response?.data?.error || 'Failed to send OTP', severity: 'error' });
        } finally {
          setLoading(false);
        }
      }
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

  // OTP Countdown Timer Effect
  useEffect(() => {
    if (otpModalOpen && otpTimeLeft > 0 && !otpExpired) {
      otpTimerRef.current = setInterval(() => {
        setOtpTimeLeft((prev) => {
          if (prev <= 1) {
            setOtpExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (otpTimerRef.current) {
        clearInterval(otpTimerRef.current);
        otpTimerRef.current = null;
      }
    }

    return () => {
      if (otpTimerRef.current) {
        clearInterval(otpTimerRef.current);
        otpTimerRef.current = null;
      }
    };
  }, [otpModalOpen, otpTimeLeft, otpExpired]);

  // Reset timer when modal closes
  useEffect(() => {
    if (!otpModalOpen) {
      setOtpTimeLeft(60);
      setOtpExpired(false);
      if (otpTimerRef.current) {
        clearInterval(otpTimerRef.current);
        otpTimerRef.current = null;
      }
    }
  }, [otpModalOpen]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP submit
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || !pendingReg || otpExpired) return;
    setOtpLoading(true);
    setError('');
    try {
      await authAPI.verifyOTPAndRegister({
        ...pendingReg,
        otp: otp.trim()
      });
      setOtpModalOpen(false);
      setToast({ open: true, message: 'Registration successful! Please login.', severity: 'success' });
      setTimeout(() => {
        setIsLogin(true);
        setUsername('');
        setPassword('');
        setName('');
        setEmail('');
        setOtp('');
        setPendingReg(null);
        navigate('/login');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed');
      setToast({ open: true, message: err.response?.data?.error || 'OTP verification failed', severity: 'error' });
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (!pendingReg) return;
    setOtpLoading(true);
    setError('');
    try {
      await authAPI.sendOTP(pendingReg.email);
      setOtp('');
      setOtpTimeLeft(60);
      setOtpExpired(false);
      setToast({ open: true, message: 'OTP resent to your email!', severity: 'success' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
      setToast({ open: true, message: err.response?.data?.error || 'Failed to resend OTP', severity: 'error' });
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <>
      <Modal open={otpModalOpen} onClose={() => setOtpModalOpen(false)}>
        <form onSubmit={handleOtpSubmit} className="otp-form">
          <div className="otp-header">
            <div className="otp-icon">📧</div>
            <h2>Email Verification</h2>
            <p>Enter the 6-digit OTP sent to your email</p>
          </div>
          
          {/* Countdown Timer */}
          <div className="otp-timer-container">
            <div className={`otp-timer ${otpExpired ? 'expired' : otpTimeLeft <= 10 ? 'warning' : ''}`}>
              <span className="timer-icon">⏱️</span>
              <span className="timer-text">
                {otpExpired ? 'OTP Expired' : `Expires in ${formatTime(otpTimeLeft)}`}
              </span>
            </div>
            {otpTimeLeft <= 10 && !otpExpired && (
              <div className="timer-warning-text">Hurry! Less than 10 seconds left</div>
            )}
          </div>

          <div className="otp-input-container">
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="000000"
              className={`otp-input ${otpExpired ? 'expired' : ''}`}
              required
              disabled={otpLoading || otpExpired}
              autoFocus
            />
          </div>

          {otpExpired && (
            <div className="otp-expired-message">
              <p>⏰ Your OTP has expired. Please request a new one.</p>
            </div>
          )}

          <button 
            type="submit" 
            className="login-button otp-button" 
            disabled={otpLoading || otp.length !== 6 || otpExpired}
          >
            {otpLoading ? (
              <>
                <LoadingSpinner size="small" inline />
                <span>Verifying...</span>
              </>
            ) : (
              '✓ Verify & Register'
            )}
          </button>

          <div className="otp-resend-container">
            <button
              type="button"
              className="resend-otp-button"
              onClick={handleResendOTP}
              disabled={otpLoading || (!otpExpired && otpTimeLeft > 0)}
            >
              {otpExpired ? '🔄 Resend OTP' : `Resend OTP (${formatTime(otpTimeLeft)})`}
            </button>
          </div>
        </form>
      </Modal>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-brand">☕ Overdoze POS</div>
            <h1 className="login-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p className="login-subtitle">
              {isLogin ? 'Sign in to access your POS system' : 'Register to get started with your POS system'}
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
              
              {!isLogin && (
                <>
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      className="form-input"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      id="email"
                      className="form-input"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </>
              )}
              
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

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? "current-password" : "new-password"}
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
                    <span>{isLogin ? 'Signing in...' : 'Registering...'}</span>
                  </>
                ) : (
                  `🚀 ${isLogin ? 'Sign In' : 'Register'}`
                )}
              </button>
            </form>
          )}

          <div className="login-footer">
            <div className="auth-switch">
              <p className="auth-text">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </p>
              <button 
                className="auth-switch-button"
                onClick={() => {
                  setError('');
                  setIsLogin(!isLogin);
                }}
                disabled={loading}
              >
                {isLogin ? 'Register' : 'Sign In'}
              </button>
            </div>
            
            <div className="forgot-password-link">
              <button 
                type="button" 
                className="text-button"
                onClick={() => navigate('/forgot-password')}
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>
            
            <button 
              className="back-button" 
              onClick={() => navigate('/')}
              disabled={loading}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={handleToastClose}
      />
    </>
  );
};

export default loginpage;
import { useState, useEffect, useContext, createContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authUtils } from '../utils/auth';

// Auth context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = () => {
      const authData = authUtils.getAuthData();
      if (authData.token && authData.user) {
        setUser(authData.user);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (token, userData) => {
    authUtils.setAuthData(token, userData);
    setUser(userData);
  };

  const logout = () => {
    authUtils.clearAuthData();
    setUser(null);
    navigate('/login');
  };

  const isAuthenticated = () => {
    return authUtils.isAuthenticated();
  };

  const isAdmin = () => {
    return authUtils.isAdmin();
  };

  const isCashier = () => {
    return authUtils.isCashier();
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isCashier,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


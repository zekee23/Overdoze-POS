// Authentication utilities
export const authUtils = {
  // Store authentication data
  setAuthData: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Get authentication data
  getAuthData: () => {
    const token = sessionStorage.getItem('token');
    const user = sessionStorage.getItem('user');
    return {
      token,
      user: user ? JSON.parse(user) : null,
    };
  },

  // Clear authentication data
  clearAuthData: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get user role
  getUserRole: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).u_role : null;
  },

  // Check if user is admin
  isAdmin: () => {
    return authUtils.getUserRole() === 'admin';
  },

  // Check if user is cashier
  isCashier: () => {
    return authUtils.getUserRole() === 'cashier';
  },
};

// Input validation utilities
export const validationUtils = {
  // Email validation
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Username validation (alphanumeric, 3-20 chars)
  isValidUsername: (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  },

  // PIN validation (4-6 digits)
  isValidPin: (pin) => {
    const pinRegex = /^\d{4,6}$/;
    return pinRegex.test(pin);
  },

  // Name validation (letters, spaces, 2-50 chars)
  isValidName: (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name.trim());
  },
};

// Security utilities
export const securityUtils = {
  // Sanitize input to prevent XSS
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim();
  },

  // Generate random session ID
  generateSessionId: () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  },
};

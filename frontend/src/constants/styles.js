export const darkTheme = {
  backgroundColor: '#0f172a',
  textColor: '#f3f4f6',
  secondaryTextColor: '#9ca3af',
  borderColor: '#374151',
  cardBackground: '#1f2937',
  primaryColor: '#3b82f6',
  successColor: '#10b981',
  warningColor: '#f59e0b',
  errorColor: '#ef4444',
  gradientBackground: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)'
};

export const cardStyles = {
  base: {
    background: darkTheme.gradientBackground,
    borderColor: 'transparent',
    borderRadius: '16px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.1)'
  },
  kpi: {
    border: 'none',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  }
};

export const modalStyles = {
  body: { 
    backgroundColor: darkTheme.backgroundColor, 
    color: darkTheme.textColor, 
    padding: '20px'
  },
  header: { 
    backgroundColor: darkTheme.backgroundColor, 
    borderBottom: `1px solid ${darkTheme.borderColor}`
  },
  content: { 
    backgroundColor: darkTheme.backgroundColor, 
    color: darkTheme.textColor,
    border: `1px solid ${darkTheme.borderColor}`
  },
  mask: { 
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(4px)'
  }
};

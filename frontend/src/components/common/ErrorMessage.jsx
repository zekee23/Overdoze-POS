import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ message, onClose, dismissible = true }) => {
  if (!message) return null;

  return (
    <div className="error-message">
      <span className="error-text">{message}</span>
      {dismissible && (
        <button 
          className="error-close" 
          onClick={onClose}
          aria-label="Close error"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;

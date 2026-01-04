import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...', inline = false }) => {
  if (inline) {
    return (
      <span className={`inline-spinner ${size}`}>
        <span className="spinner"></span>
      </span>
    );
  }
  
  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner ${size}`}>
        <div className="spinner"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;

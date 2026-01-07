import { useEffect } from 'react';
import './Toast.css';

const Toast = ({ open, message, severity = 'success', duration = 2500, onClose }) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className={`custom-toast ${severity}`}> 
      {message}
      <button className="toast-close" onClick={onClose} aria-label="Close toast">×</button>
    </div>
  );
};

export default Toast;

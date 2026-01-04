import React from "react";
import "./removeModal.css";

export default function ClearCartModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box modern-modal">

        {/* Header Banner */}
        <div className="modal-header">
          <div className="modal-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h3>Clear Cart</h3>
          <p>This will permanently remove all items from your cart.</p>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p className="body-text">
            Are you sure you want to <strong>clear all items</strong>?  
            This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="remove-btn" onClick={onConfirm}>Clear Cart</button>
        </div>

      </div>
    </div>
  );
}

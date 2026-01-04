import ReactDOM from "react-dom";
import "./RemoveModal.css";

export default function RemoveModal({ isOpen, itemName, onClose, onConfirm }) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-box">

        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#fef3c7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            {/* SVG ICON */}
          </div>
        </div>

        <h3>Remove Item</h3>

        <p>
          Are you sure you want to remove <strong>{itemName}</strong> from the cart?
        </p>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="remove-btn" onClick={onConfirm}>Remove</button>
        </div>

      </div>
    </div>,
    document.body
  );
}

import { useState, useCallback, useRef, useEffect } from "react";
import "./OrderConfirmationModal.css";

const OrderConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  cart,
  cartTotal,
  paymentMethod,
  onPaymentMethodChange,
}) => {
  const [cashInput, setCashInput] = useState("");
  const [displayCashInput, setDisplayCashInput] = useState("");
  const [change, setChange] = useState(0);
  const [lastQuickPress, setLastQuickPress] = useState(null);
  const [lastQuickTime, setLastQuickTime] = useState(0);
  
  // Debouncing refs
  const debounceTimeoutRef = useRef(null);

  // Reset function to clear cash input
  const resetCashInput = useCallback(() => {
    setCashInput("");
    setDisplayCashInput("");
    setChange(0);
    setLastQuickPress(null);
    setLastQuickTime(0);
  }, []);

  // Debounced cash change handler
  const debouncedCashChange = useCallback((value) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const cashAmount = parseFloat(value) || 0;
      const calculatedChange = cashAmount - cartTotal;
      setChange(calculatedChange > 0 ? calculatedChange : 0);
      setCashInput(value);
    }, 300); // 300ms debounce delay
  }, [cartTotal]);

  // Immediate update for display
  const handleCashChange = useCallback((value) => {
    setDisplayCashInput(value);
    
    // For all inputs (including quick amounts), use debouncing
    debouncedCashChange(value);
  }, [debouncedCashChange]);

  const handleNumberClick = useCallback((number) => {
    const currentValue = displayCashInput || "0";
    const newValue = currentValue === "0" ? number.toString() : currentValue + number.toString();
    handleCashChange(newValue);
  }, [displayCashInput, handleCashChange]);

  const handleExactClick = useCallback(() => {
    handleCashChange(cartTotal.toString());
  }, [cartTotal, handleCashChange]);

  const handleDecimalClick = useCallback(() => {
    if (!displayCashInput.includes(".")) {
      const newValue = displayCashInput || "0";
      handleCashChange(newValue + ".");
    }
  }, [displayCashInput, handleCashChange]);

  const handleClearClick = useCallback(() => {
    handleCashChange("");
  }, [handleCashChange]);

  const handleBackspaceClick = useCallback(() => {
    if (displayCashInput.length > 1) {
      handleCashChange(displayCashInput.slice(0, -1));
    } else {
      handleCashChange("");
    }
  }, [displayCashInput, handleCashChange]);

  const handleQuickAmount = useCallback((amount) => {
    const currentTime = Date.now();
    const isDoublePress = 
      lastQuickPress === amount && 
      (currentTime - lastQuickTime) < 500; // 500ms window for double press
    
    if (isDoublePress) {
      // Add to existing amount
      const currentAmount = parseFloat(displayCashInput) || 0;
      const newAmount = currentAmount + amount;
      handleCashChange(newAmount.toString());
    } else {
      // Replace existing amount
      handleCashChange(amount.toString());
    }
    
    setLastQuickPress(amount);
    setLastQuickTime(currentTime);
  }, [lastQuickPress, lastQuickTime, displayCashInput, handleCashChange]);

  const handleConfirmOrder = () => {
    if (paymentMethod === 'cash') {
      const cashAmount = parseFloat(cashInput || displayCashInput) || 0;
      if (cashAmount >= cartTotal) {
        onConfirm({ cashAmount, change });
        resetCashInput(); // Clear cash input after order confirmation
      }
    } else {
      // GCash payment - no cash calculation needed
      onConfirm({ cashAmount: cartTotal, change: 0 });
    }
  };

  const cashAmount = parseFloat(cashInput || displayCashInput) || 0;
  const canConfirm = paymentMethod === 'cash' ? cashAmount >= cartTotal : true;

  // Reset cash input when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetCashInput();
    }
  }, [isOpen, resetCashInput]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="oc-overlay">
      <div className="oc-modal">

        {/* HEADER */}
        <div className="oc-header">
          <h2>Confirm Order</h2>
          <button className="oc-close" onClick={onClose}>×</button>
        </div>

        {/* BODY */}
        <div className="oc-body">
          {/* PAYMENT METHOD SELECTION */}
          <div className="oc-payment-method">
            <label className="oc-payment-label">Payment Method:</label>
            <div className="oc-payment-options">
              <button 
                className={`oc-payment-btn ${paymentMethod === 'cash' ? 'oc-payment-active' : ''}`}
                onClick={() => onPaymentMethodChange('cash')}
              >
                 Cash
              </button>
              <button 
                className={`oc-payment-btn ${paymentMethod === 'gcash' ? 'oc-payment-active' : ''}`}
                onClick={() => onPaymentMethodChange('gcash')}
              >
                <img src="/gcash.png" alt="GCash" className="oc-payment-icon" />
                GCash
              </button>
            </div>
          </div>

          {cart.map((item, index) => (
            <div key={index} className="oc-item">

              {/* NAME + PRICE */}
              <div className="oc-item-top">
                <div className="oc-item-name">
                  {item.product_name}
                  <span className="oc-qty">×{item.quantity}</span>
                </div>
                <div className="oc-item-price">
                  ₱{item.totalPrice.toFixed(2)}
                </div>
              </div>

              {/* DETAILS */}
              <div className="oc-item-details">

  {/* SIZE */}
  {item.variant?.size_label && (
    <div className="oc-row">
      <span>Size</span>
      <span>{item.variant.size_label}</span>
    </div>
  )}

  {/* SUGAR LEVEL */}
  {item.sugar && (
    <div className="oc-row">
      <span>Sugar Level</span>
      <span>{item.sugar.name}</span>
    </div>
  )}

  {/* ADD-ONS */}
  {Array.isArray(item.addons) && item.addons.length > 0 && (
    <div className="oc-row">
      <span>Add-ons</span>
      <span>
        {item.addons.map(a => a.extras_name || a.name).join(", ")}
      </span>
    </div>
  )}

</div>


            </div>
          ))}
        </div>

        {/* CASH CALCULATOR - Only show for cash payments */}
        {paymentMethod === 'cash' && (
        <div className="oc-cash-section">
          <div className="oc-cash-input-row">
            <label className="oc-cash-label">Cash Received:</label>
            <div className="oc-cash-display">
              <span className="oc-cash-currency">₱</span>
              <input
                type="text"
                value={displayCashInput}
                onChange={(e) => handleCashChange(e.target.value)}
                placeholder="0.00"
                className="oc-cash-input"
              />
            </div>
          </div>
          
          {change > 0 && (
            <div className="oc-change-row">
              <span className="oc-change-label">Change:</span>
              <span className="oc-change-amount">₱{change.toFixed(2)}</span>
            </div>
          )}

          <div className="oc-calculator">
            <div className="oc-calc-row">
              <button onClick={() => handleNumberClick(7)} className="oc-calc-btn">7</button>
              <button onClick={() => handleNumberClick(8)} className="oc-calc-btn">8</button>
              <button onClick={() => handleNumberClick(9)} className="oc-calc-btn">9</button>
              <button onClick={handleClearClick} className="oc-calc-btn oc-calc-clear">C</button>
            </div>
            <div className="oc-calc-row">
              <button onClick={() => handleNumberClick(4)} className="oc-calc-btn">4</button>
              <button onClick={() => handleNumberClick(5)} className="oc-calc-btn">5</button>
              <button onClick={() => handleNumberClick(6)} className="oc-calc-btn">6</button>
              <button onClick={handleBackspaceClick} className="oc-calc-btn oc-calc-backspace">⌫</button>
            </div>
            <div className="oc-calc-row">
              <button onClick={() => handleNumberClick(1)} className="oc-calc-btn">1</button>
              <button onClick={() => handleNumberClick(2)} className="oc-calc-btn">2</button>
              <button onClick={() => handleNumberClick(3)} className="oc-calc-btn">3</button>
              <button onClick={handleExactClick} className="oc-calc-btn oc-calc-exact">Exact</button>
            </div>
            <div className="oc-calc-row">
              <button onClick={() => handleNumberClick(0)} className="oc-calc-btn">0</button>
              <button onClick={handleDecimalClick} className="oc-calc-btn">.</button>
              <button onClick={() => handleQuickAmount(50)} className="oc-calc-btn oc-calc-quick">50</button>
              <button onClick={() => handleQuickAmount(100)} className="oc-calc-btn oc-calc-quick">100</button>
            </div>
          </div>
        </div>
        )}

        {/* TOTAL */}
        <div className="oc-total">
          <span>Total Amount</span>
          <span className="oc-total-price">
            {cartTotal.toFixed(2)}
          </span>
        </div>

        {/* FOOTER */}
        <div className="oc-footer">
          <button className="oc-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            className={`oc-confirm ${!canConfirm ? 'oc-confirm-disabled' : ''}`}
            onClick={handleConfirmOrder}
            disabled={!canConfirm}
          >
            Confirm Order
          </button>
        </div>

      </div>
    </div>
  );
};

export default OrderConfirmationModal;

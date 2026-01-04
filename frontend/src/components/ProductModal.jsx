import React, { useState, useEffect } from 'react';
import api from  '../utils/api';
import './ProductModal.css';


const ProductModal = ({ product, onClose, onAddToCart, sugarLevels, addons }) => {
   const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const hideSugarAndAddons = product?.category_id === 3;
  const [outOfStockLoading, setOutOfStockLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);



  const handleOutOfStock = async () => {
    setShowConfirmDialog(true);
  };

  const confirmOutOfStock = async () => {
    try {
      setOutOfStockLoading(true);
      setShowConfirmDialog(false);

      await api.post(`/set-stock-status/${product.product_id}`);
      
      // Show success feedback
      const successMessage = document.createElement('div');
      successMessage.className = 'success-toast';
      successMessage.innerHTML = `
        <div class="toast-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Product marked as out of stock successfully</span>
        </div>
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        successMessage.classList.add('show');
      }, 100);
      
      setTimeout(() => {
        successMessage.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(successMessage);
        }, 300);
      }, 3000);
      
      onClose(); // close modal
    } catch (err) {
      console.error(err);
      
      // Show error feedback
      const errorMessage = document.createElement('div');
      errorMessage.className = 'error-toast';
      errorMessage.innerHTML = `
        <div class="toast-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Failed to update product status</span>
        </div>
      `;
      document.body.appendChild(errorMessage);
      
      setTimeout(() => {
        errorMessage.classList.add('show');
      }, 100);
      
      setTimeout(() => {
        errorMessage.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(errorMessage);
        }, 300);
      }, 3000);
    } finally {
      setOutOfStockLoading(false);
    }
  };

  const cancelOutOfStock = () => {
    setShowConfirmDialog(false);
  };



  // Fallback data if props are not provided or empty
  const safeSugarLevels = sugarLevels?.length > 0 ? sugarLevels : [
    { id: 1, level_name: '0%' },
    { id: 2, level_name: '25%' },
    { id: 3, level_name: '50%' },
    { id: 4, level_name: '75%' },
    { id: 5, level_name: '100%' }
  ];

  const safeAddons = Array.isArray(addons)
  ? addons
      .map(a => ({
        ...a,
        add_id: Number(a.add_id),
        price: Number(a.price) || 0
      }))
      .filter(a => Number.isInteger(a.add_id))
  : [];


  const [sugarLevel, setSugarLevel] = useState(safeSugarLevels[0]?.id || '');

  // Set initial sugar level when sugarLevels prop changes
  useEffect(() => {
    if (safeSugarLevels?.length > 0) {
      setSugarLevel(safeSugarLevels[0].id);
    }
  }, [sugarLevels]);

  const handleAddonToggle = (addon) => {
  if (!Number.isInteger(addon.add_id)) return;

  setSelectedAddons(prev => {
    const exists = prev.some(a => a.add_id === addon.add_id);
    return exists
      ? prev.filter(a => a.add_id !== addon.add_id)
      : [...prev, { ...addon, quantity: 1 }];
  });
};


  const handleSubmit = () => {
  const orderItem = {
    product_id: product.product_id,
    variant: {
      variant_id: selectedVariant.variant_id,
      price: selectedVariant.price
    },
    quantity,
    addons: hideSugarAndAddons
      ? []
      : selectedAddons.map(a => ({
          add_id: a.add_id,
          price: a.price,
          quantity: 1
        })),
    sugar: hideSugarAndAddons
      ? null
      : { sugarlevel_id: sugarLevel },
    totalPrice:
      ((selectedVariant?.price || 0) +
        (hideSugarAndAddons
          ? 0
          : selectedAddons.reduce((sum, a) => sum + a.price, 0))
      ) * quantity
  };

  onAddToCart(orderItem);
  onClose();
};


  if (!product) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <div>
              <h2 className="product-title">{product.product_name}</h2>
              <p className="product-category">{product.category_name || 'Beverage'}</p>
            </div>
            <button onClick={onClose} className="close-button">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
          </div>

          <div className="modal-body">
            {/* Size Selection */}
            <div className="section">
              <h3 className="section-title">Size</h3>
              <div className="options-grid">
                {product.variants?.map(variant => (
                  <button
                    key={variant.variant_id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`option-button ${
                      selectedVariant?.variant_id === variant.variant_id ? 'selected' : ''
                    }`}
                  >
                    <span className="option-name">{variant.size_label}</span>
                    <span className="option-price">₱{variant.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sugar Level */}
           {!hideSugarAndAddons && (
  <div className="section">
    <h3 className="section-title">Sugar Level</h3>
    <div className="options-grid">
      {safeSugarLevels.map(level => (
        <button
          key={level.id}
          onClick={() => setSugarLevel(level.id)}
          className={`option-button ${
            sugarLevel === level.id ? 'selected' : ''
          }`}
        >
          {level.level_name}
        </button>
      ))}
    </div>
  </div>
)}


            {/* Add-ons */}
            {!hideSugarAndAddons && (
  <div className="section">
    <h3 className="section-title">Add-ons</h3>
    <div className="addons-list">
      {safeAddons.map(addon => (
        <div 
          key={`addon-ui-${addon.add_id}`}
          className={`addon-item ${
            selectedAddons.some(a => a.add_id === addon.add_id) ? 'selected' : ''
          }`}
          onClick={() => handleAddonToggle(addon)}
        >
          <div className="addon-checkbox">
            {selectedAddons.some(a => a.add_id === addon.add_id) && (
              <svg width="12" height="9" viewBox="0 0 12 9">
                <path d="M1 4.5L4.5 8L11 1" stroke="currentColor" strokeWidth="2"/>
              </svg>
            )}
          </div>
          <span className="addon-name">{addon.extras_name}</span>
          <span className="addon-price">+₱{addon.price.toFixed(2)}</span>
        </div>
      ))}
    </div>
  </div>
)}


            {/* Quantity */}
            <div className="section">
              <h3 className="section-title">Quantity</h3>
              <div className="quantity-selector">
                <button 
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="quantity-button"
                >
                  -
                </button>
                <span className="quantity-display">{quantity}</span>
                <button 
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="quantity-button"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <div className="footer-actions">
              <button
                onClick={handleOutOfStock}
                disabled={outOfStockLoading}
                className="out-of-stock-button"
              >
                <span className="button-icon">
                  {outOfStockLoading ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2v10l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                {outOfStockLoading ? 'Processing...' : 'Mark Out of Stock'}
              </button>

              <div className="total-container">
                <span>Total:</span>
                <span className="total-amount">
                  ₱{((selectedVariant?.price || 0) * quantity + 
                    selectedAddons.reduce((sum, addon) => sum + addon.price, 0) * quantity
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selectedVariant}
              className={`add-to-cart-button ${!selectedVariant ? 'disabled' : ''}`}
            >
              <span className="button-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 2L6 9H3L5 21H19L21 9H18L15 2H9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 9V2M15 9V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Add to Cart
              </span>
            </button>
          </div>

          {/* Confirmation Dialog */}
          {showConfirmDialog && (
            <div className="confirm-dialog-overlay">
              <div className="confirm-dialog">
                <div className="dialog-header">
                  <div className="dialog-icon warning">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 9v4M12 17h.01M21 12c0 4.9706-4.0294 9-9 9s-9-4.0294-9-9 4.0294-9 9-9 9 4.0294 9 9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3>Confirm Out of Stock</h3>
                </div>
                
                <div className="dialog-content">
                  <p>Are you sure you want to mark <strong>{product.product_name}</strong> as out of stock?</p>
                  <p className="warning-text">This action will prevent customers from ordering this product until it's restocked.</p>
                </div>
                
                <div className="dialog-actions">
                  <button
                    onClick={cancelOutOfStock}
                    className="cancel-button"
                    disabled={outOfStockLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmOutOfStock}
                    disabled={outOfStockLoading}
                    className="confirm-button danger"
                  >
                    {outOfStockLoading ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2v10l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Confirm
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProductModal;

import { useState, useEffect } from 'react';
import api from '../utils/api';

const StockInputModal = ({ isOpen, onClose, onStockAdded }) => {
  const [variants, setVariants] = useState([]);
  const [currentStock, setCurrentStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stockInputs, setStockInputs] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Only fetch if we don't have stock data yet
      if (!currentStock) {
        fetchVariants();
      }
    }
  }, [isOpen, currentStock]);

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cup-stock');
      const stockData = response.data.stock_data;
      
      // Initialize stock inputs for each size
      const inputs = {};
      const sizes = stockData.map(stock => {
        inputs[stock.size_label] = '';
        return {
          size_label: stock.size_label,
          display_name: stock.size_label,
          current_stock: stock.stock_count
        };
      });
      
      setVariants(sizes);
      setStockInputs(inputs);
      setCurrentStock(stockData.reduce((acc, stock) => {
        acc[stock.size_label] = stock;
        return acc;
      }, {}));
    } catch (error) {
      console.error('Error fetching cup stock:', error);
      setMessage('Error loading cup stock data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentStock = async () => {
    // Stock data is already fetched in fetchVariants
  };

  const handleInputChange = (variantId, value) => {
    setStockInputs(prev => ({
      ...prev,
      [variantId]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const results = [];
      
      // Process each size with input
      for (const [sizeLabel, quantity] of Object.entries(stockInputs)) {
        if (quantity && quantity > 0) {
          const response = await api.post('/cup-stock/add', {
            size_label: sizeLabel,
            add_quantity: parseInt(quantity)
          });
          results.push(response.data);
        }
      }

      if (results.length > 0) {
        setMessage(`Successfully added stock for ${results.length} size(s)`);
        if (onStockAdded) {
          onStockAdded(results);
        }
        
        // Refresh current stock
        await fetchVariants();
        
        // Clear inputs after successful submission
        const clearedInputs = {};
        Object.keys(stockInputs).forEach(size => {
          clearedInputs[size] = '';
        });
        setStockInputs(clearedInputs);
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMessage('Please enter at least one quantity');
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      setMessage(error.response?.data?.error || 'Error adding stock');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content stock-modal">
        <div className="modal-header">
          <div className="header-left">
            <button 
              className="refresh-button" 
              onClick={fetchVariants}
              disabled={loading}
              title="Refresh cup stock data"
            >
              🔄
            </button>
          </div>
          <h2>Cup Stock Management</h2>
          <div className="header-right">
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        </div>
        
        <div className="modal-body">
          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
          
          {loading ? (
            <div className="loading">Loading cup stock data...</div>
          ) : (
            <form onSubmit={handleSubmit} className="stock-form">
              <div className="variants-grid">
                {variants.map((size) => {
                  const stock = currentStock[size.size_label];
                  return (
                    <div key={size.size_label} className="variant-input-row">
                      <div className="variant-info">
                        <label className="variant-label">
                          {size.display_name || size.size_label}
                          {size.variant_count && (
                            <span className="variant-count">({size.variant_count} variants)</span>
                          )}
                        </label>
                        {stock && (
                          <div className="current-stock">
                            <span className={`stock-status ${stock.stock_status.toLowerCase().replace(' ', '-')}`}>
                              {stock.stock_count} available
                            </span>
                          </div>
                        )}
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={stockInputs[size.size_label] || ''}
                        onChange={(e) => handleInputChange(size.size_label, e.target.value)}
                        placeholder="0"
                        className="stock-input"
                      />
                    </div>
                  );
                })}
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Adding Stock...' : 'Add Stock'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockInputModal;

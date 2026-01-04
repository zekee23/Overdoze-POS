import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import VirtualProductGrid from '../components/VirtualProductGrid';
import SkeletonLoader from '../components/SkeletonLoader';
import PerformanceMonitor from '../components/PerformanceMonitor';
import RemoveModal from "../components/common/removeModal.jsx";
import ClearCartModal from "../components/common/clearCartModal.jsx";
import OrderConfirmationModal from '../components/OrderConfirmationModal';
import '../components/ProductCard.css';
import './pos.css';
import api from '../utils/api';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import Tooltip from '@mui/material/Tooltip';
import { getCategoryStyle } from '../constants/categoryStyles';
import { useCartOperations } from '../hooks/useCartOperations';



const POS = memo(() => {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([{ category_id: 0, category_name: 'All' }]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();
  const [productVariants, setProductVariants] = useState({});
  const [sugarLevels, setSugarLevels] = useState([]);
  const [addons, setAddons] = useState([]);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  //test removal
  const [itemToRemove, setItemToRemove] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [showOrderConfirmationModal, setShowOrderConfirmationModal] = useState(false);

  const [removeIndex, setRemoveIndex] = useState(null);
  const [removeName, setRemoveName] = useState("");

  // Memoize expensive calculations
  const cartSubtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + item.totalPrice, 0), 
    [cart]
  );
  
  const cartTotal = useMemo(() => cartSubtotal, [cartSubtotal]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 0) return products;
    return products.filter(product => product.category_id === selectedCategory);
  }, [products, selectedCategory]);
  

const handleRemoveClick = (index) => {
  setItemToRemove(index);
  setShowRemoveModal(true);
};

const confirmRemove = () => {
  if (itemToRemove !== null) {
    const newCart = [...cart];
    newCart.splice(itemToRemove, 1);
    setCart(newCart);
    setShowRemoveModal(false);
    setItemToRemove(null);
  }
};

const cancelRemove = () => {
  setShowRemoveModal(false);
  setItemToRemove(null);
};

const handleClearCart = () => {
  setShowClearCartModal(true);
};

const confirmClearCart = () => {
  setCart([]);
  setShowClearCartModal(false);
};

const cancelClearCart = () => {
  setShowClearCartModal(false);
};



  

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/login');
      return;
    }

    // Fetch products from backend - non-blocking
    fetchProducts();
  }, [navigate]);

  // Optimistic UI update - show cached data immediately while fetching
  useEffect(() => {
    const cacheKey = 'pos_data_cache';
    const cacheTimestampKey = 'pos_data_cache_timestamp';
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTimestamp = localStorage.getItem(cacheTimestampKey);
    
    // Show cached data immediately if available
    if (cachedData && cacheTimestamp) {
      const parsedData = JSON.parse(cachedData);
      const { categories, products, sugarLevels, addons, productsWithVariants } = parsedData;
      
      setCategories([{ category_id: 0, category_name: 'All' }, ...categories]);
      setSugarLevels(sugarLevels);
      setAddons(addons);
      
      const variantsMap = {};
      productsWithVariants.forEach(product => {
        if (product.variants && product.variants.length > 0) {
          variantsMap[product.product_id] = product.variants;
        }
      });
      
      setProductVariants(variantsMap);
      setProducts(productsWithVariants);
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    const abortController = new AbortController();
    
    try {
      // Don't set loading to true if we already have cached data showing
      const hasCachedData = localStorage.getItem('pos_data_cache');
      if (!hasCachedData) {
        setLoading(true);
      }
      
      // Check cache first
      const cacheKey = 'pos_data_cache';
      const cacheTimestampKey = 'pos_data_cache_timestamp';
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(cacheTimestampKey);
      
      // Use cache if it exists and is less than 15 days old
      const CACHE_DURATION = 15 * 24 * 60 * 60 * 1000; // 15 days
      if (cachedData && cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < CACHE_DURATION) {
        // If we already showed optimistic data, no need to set it again
        if (!hasCachedData) {
          const parsedData = JSON.parse(cachedData);
          const { categories, products, sugarLevels, addons, productsWithVariants } = parsedData;
          
          setCategories([{ category_id: 0, category_name: 'All' }, ...categories]);
          setSugarLevels(sugarLevels);
          setAddons(addons);
          
          const variantsMap = {};
          productsWithVariants.forEach(product => {
            if (product.variants && product.variants.length > 0) {
              variantsMap[product.product_id] = product.variants;
            }
          });
          
          setProductVariants(variantsMap);
          setProducts(productsWithVariants);
        }
        setLoading(false);
        return;
      }
      
      // Fetch all POS data in single API call with abort signal
      const posResponse = await api.get('/pos-data', {
        signal: abortController.signal
      });
      const { categories, products, sugarLevels, addons, productsWithVariants } = posResponse.data;
      
      // Cache the data
      localStorage.setItem(cacheKey, JSON.stringify(posResponse.data));
      localStorage.setItem(cacheTimestampKey, Date.now().toString());
      
      // Set categories with "All" option
      setCategories([{ category_id: 0, category_name: 'All' }, ...categories]);
      
      // Set sugar levels and addons
      setSugarLevels(sugarLevels);
      setAddons(addons);
      
      // Create a map of product_id to its variants for easier access
      const variantsMap = {};
      productsWithVariants.forEach(product => {
        if (product.variants && product.variants.length > 0) {
          variantsMap[product.product_id] = product.variants;
        }
      });
      
      setProductVariants(variantsMap);
      setProducts(productsWithVariants);
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching POS data:', error);
        // Fallback to sample data if API fails
        const sampleProducts = [
          { 
            product_id: 1, 
            product_name: 'Sample Coffee', 
            category_id: 1,
            category_name: 'Hot Coffee',
            variants: [
              { variant_id: 1, size_label: '12oz', price: 100.00, is_default: true },
              { variant_id: 2, size_label: '16oz', price: 120.00, is_default: false }
            ]
          },
          { 
            product_id: 2, 
            product_name: 'Iced Latte', 
            category_id: 2,
            category_name: 'Cold Brew',
            variants: [
              { variant_id: 3, size_label: '16oz', price: 130.00, is_default: true },
              { variant_id: 4, size_label: '22oz', price: 150.00, is_default: false }
            ]
          }
        ];
        
        // Set sample categories
        const sampleCategories = [
          { category_id: 0, category_name: 'All' },
          { category_id: 1, category_name: 'Hot Coffee' },
          { category_id: 2, category_name: 'Cold Brew' }
        ];
        
        // Set sample variants
        const sampleVariants = {
          1: [
            { variant_id: 1, size_label: '12oz', price: 100.00, is_default: true },
            { variant_id: 2, size_label: '16oz', price: 120.00, is_default: false }
          ],
          2: [
            { variant_id: 3, size_label: '16oz', price: 130.00, is_default: true },
            { variant_id: 4, size_label: '22oz', price: 150.00, is_default: false }
          ]
        };
        
        // Set sample sugar levels and addons
        const sampleSugarLevels = [
          { id: 1, level_name: 'Full Sugar' },
          { id: 2, level_name: 'Less Sugar' },
          { id: 3, level_name: 'No Sugar' }
        ];
        
        const sampleAddons = [
          { id: 1, extras_name: 'Pearls', price: 20.00 },
          { id: 2, extras_name: 'Pudding', price: 25.00 },
          { id: 3, extras_name: 'Cheese Foam', price: 30.00 }
        ];
        
        setProducts(sampleProducts);
        setCategories(sampleCategories);
        setProductVariants(sampleVariants);
        setSugarLevels(sampleSugarLevels);
        setAddons(sampleAddons);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const clearProductCache = () => {
    localStorage.removeItem('pos_data_cache');
    localStorage.removeItem('pos_data_cache_timestamp');
  };

  const { handleAddToCart, updateQty } = useCartOperations(products, sugarLevels, addons);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const handleAddItemToCart = (newItem) => {
    handleAddToCart(newItem, setCart);
  };

  const handleUpdateQty = (index, change, e) => {
    updateQty(index, change, e, cart, setCart);
  };


const handleCheckout = () => {
  if (cart.length === 0) {
    alert('Cart is empty');
    return;
  }

  // Show confirmation modal instead of directly processing order
  setShowOrderConfirmationModal(true);
};

const confirmOrder = async () => {
  console.log('Processing order with items:', cart);

  try {
    await api.post('/orders', {
      cashier_id: user.uid,
      total_amount: cartTotal,
      cart: cart.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,

        variant: item.variant
          ? {
              variant_id: item.variant.variant_id,
              size_label: item.variant.size_label || null
            }
          : null,

        sugar: item.sugar
          ? {
              sugarlevel_id: item.sugar.sugarlevel_id,
              name: item.sugar.name
            }
          : null,

        quantity: item.quantity,

        addons: Array.isArray(item.addons) && item.addons.length > 0
          ? item.addons.map(a => ({
              add_id: a.add_id,
              name: a.extras_name || a.name || '',
              price: Number(a.price) || 0,
              quantity: a.quantity || 1
            }))
          : [],

        total_price: item.totalPrice
      }))
    });

    // ✅ Clear cart after successful order
    setCart([]);
    setShowOrderConfirmationModal(false);
    alert('Order completed successfully');

  } catch (err) {
    console.error('Checkout error:', err);
    alert('Failed to process order');
  }
};


const cancelOrder = () => {
  setShowOrderConfirmationModal(false);
};



  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleRefreshProducts = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    const rateLimitDelay = 10000 ; // 3 seconds rate limit for POS

    if (timeSinceLastRefresh < rateLimitDelay) {
      const remainingTime = Math.ceil((rateLimitDelay - timeSinceLastRefresh) / 1000);
      alert(`Please wait ${remainingTime} second(s) before refreshing again`);
      return;
    }

    setLastRefreshTime(now);
    setIsRefreshing(true);
    clearProductCache();
    await fetchProducts();
    setIsRefreshing(false);
  }, [lastRefreshTime]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="pos-container">
        <header className="pos-navbar">
          <div className="nav-left">
            <h1 className="app-title">Overdoze POS</h1>
            <span className="location">Lopez, Quezon</span>
          </div>
        </header>
        <div className="main-content">
          <div className="products-section">
            <SkeletonLoader type="grid" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-container">
      <PerformanceMonitor />
      <header className="pos-navbar">
        <div className="nav-left">
          <h1 className="app-title">Overdoze POS</h1>
          <span className="location">Lopez, Quezon</span>
        </div>
        <div className="nav-right">
           {cart.length === 0 && (
        <div className="empty-cart">
          <i className="fas fa-shopping-cart"></i>
          
        </div>
      )}
          <Tooltip title="Refresh Products">
            <IconButton 
              className="nav-button" 
              onClick={handleRefreshProducts}
              color="inherit"
              disabled={isRefreshing}
            >
              <RefreshIcon style={{ 
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none' 
              }} />
            </IconButton>
          </Tooltip>
          <span className="nav-button"><i className="fas fa-shopping-cart"></i>Total Items: {cart.reduce((s, i) => s + i.quantity, 0)}</span>
          <div className="user-dropdown">
            
            <button className="nav-button user-button">
              
              <i className="fas fa-user"></i>{user.full_name}
              <i className="fas fa-caret-down"></i>
            </button>
            <div className="dropdown-menu">
              <a href="#" className="dropdown-item" onClick={handleLogout}>
                Logout
              </a>
            </div>
          </div>
        </div>
      </header>

       <div className="main-content">
        <div className="products-section">
          <div className="category-filters">
            {categories.map((category) => {
              const style = getCategoryStyle(category.category_id);
              return (
                <button
                  key={category.category_id}
                  className={`category-btn ${selectedCategory === category.category_id ? 'active' : ''}`}
                  onClick={() => handleCategoryFilter(category.category_id)}
                  style={{
                    '--category-color': style.color,
                    '--category-hover': `${style.color}20`,
                    '--category-active': `${style.color}30`
                  }}
                >
                  <span className="category-emoji" style={{ marginRight: '8px' }}>{style.image}</span>
                  {category.category_name}
                </button>
              );
            })}
          </div>
          
          <VirtualProductGrid
            products={filteredProducts}
            onProductClick={handleProductClick}
            categories={categories}
          />
        </div>
          
        <div className="cart-section">
  <div className="order-summary">
    <div className="order-header">
      <h3>Order Summary</h3>

      <button 
        className="clear-btn"
        onClick={handleClearCart}
      >
        Clear
      </button>
    </div>

    <div className="order-content">

      {/* EMPTY CART */}
     

      {/* CART ITEMS */}
      <div className="cart-items">
  {cart.map((item, index) => (
    <div key={index} className="cart-item">
    
    {/* PRODUCT NAME AND PRICE - TOP ROW */}
    <div className="item-header">
      <strong className="item-name">{item.product_name}</strong>
      <span className="item-price">₱{item.totalPrice.toFixed(2)}</span>
    </div>

    {/* PRODUCT DETAILS - MIDDLE ROW */}
    <div className="item-meta">
      <div>Size: <strong>{item.variant.size_label}</strong></div>
      {item.sugar && (
  <div>
    Sugar: <strong>{item.sugar.name}</strong>
  </div>
)}
    </div>

    {/* ADDONS - IF ANY */}
    {item.addons.length > 0 && (
      <div className="item-addons">
        <span className="addons-label">Add-ons:</span>
        <div className="addons-list">
          {item.addons.map(add => (
            <span key={add.add_id} className="addon-chip">
              {add.extras_name||''}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* QUANTITY AND REMOVE - BOTTOM ROW */}
    <div className="item-actions">
      <div className="qty-control">
        <button 
          onClick={(e) => handleUpdateQty(index, -1, e)}
          className="qty-btn"
        >
          -
        </button>
        <span className="quantity">{item.quantity}</span>
        <button 
          onClick={(e) => handleUpdateQty(index, 1, e)}
          className="qty-btn"
        >
          +
        </button>
      </div>

      <button 
        className="remove-btn-pos"
        onClick={() => handleRemoveClick(index)}
      >
        Remove
      </button>
    </div>
  </div>
  ))}
  
  {showRemoveModal && itemToRemove !== null && (
  <RemoveModal
    isOpen={showRemoveModal}
    itemName={cart[itemToRemove]?.product_name || 'this item'}
    onClose={cancelRemove}
    onConfirm={confirmRemove}
  />
)}
      </div>

    </div>
 
</div>

      {/* TOTALS */}
      <div className="order-totals">
        <div className="total-row final">
          <span>Total</span>
          <span>₱{cartTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="order-actions">
        <button className="charge-btn" onClick={handleCheckout}>
          Charge ₱{cartTotal.toFixed(2)}
        </button>
      </div>
    </div>
  </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddItemToCart}
          sugarLevels={sugarLevels}
          addons={addons}
        />
      )}

      {/* Clear Cart Modal */}
      <ClearCartModal
        isOpen={showClearCartModal}
        onClose={cancelClearCart}
        onConfirm={confirmClearCart}
      />

      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        isOpen={showOrderConfirmationModal}
        onClose={cancelOrder}
        onConfirm={confirmOrder}
        cart={cart}
        cartTotal={cartTotal}
      />
    </div>
  );
});

export default POS;

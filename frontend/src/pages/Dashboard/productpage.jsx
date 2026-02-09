import { useState, useEffect, useRef, useMemo, useCallback} from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  message, 
  Modal, 
  Row,
  Col,
 
  Statistic,
  Form,
  Input,
  
  Select,
  Popconfirm
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ReloadOutlined, 
  MenuOutlined, 
  UserOutlined, 
  LogoutOutlined,
  ShoppingOutlined,
  InboxOutlined
} from '@ant-design/icons';
import OverlaySidebar from '../../components/OverlaySidebar';
import api from '../../utils/api';
import '../Dashboard.css';
import './productpage.css';
import './dashboard-modals.css';
import VariantsModal from '../../components/variants/VariantsModal';
import Toast from '../../components/common/Toast';

const { Title, Text } = Typography;
const { Option } = Select;

const ProductPage = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [variantsModalVisible, setVariantsModalVisible] = useState(false);
  const [createdProductId, setCreatedProductId] = useState(null);
  const [variants, setVariants] = useState([]);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [priceEditModalVisible, setPriceEditModalVisible] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Performance optimization: use refs for debouncing and local state
  const searchTimeoutRef = useRef(null);
  const variantTimeoutRef = useRef(null);
  const searchInputRef = useRef(null); 

  // Static categories with IDs 1-7
  const categories = [
    { id: 1, name: 'Cold Brew Coffee' },
    { id: 2, name: 'Hot Coffee' },
    { id: 3, name: 'Pastries' },
    { id: 4, name: 'Espresso Based' },
    { id: 5, name: 'Non-coffee' },
    { id: 6, name: 'OD Milkshake' },
    { id: 7, name: 'OD Fuzz' },
    { id: 8, name: 'Milk-based' },
    { id: 9, name: 'OD Lemonade' },
    { id: 10, name: 'OD Float' },
    { id: 11, name: "OD's after hours" },
    { id: 12, name: 'Protein(Iced/Ice Blend)' }
  ];

  // Memoize categories to prevent unnecessary re-renders
  const memoizedCategories = useMemo(() => categories, []);

  // Cache configuration
  const CACHE_KEY = 'products_cache';
  const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  // Get cached products or fetch new ones
  const fetchProducts = async (forceRefresh = false) => {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const now = Date.now();
          
          // Use cache if it's still valid (less than 30 days old)
          if (now - timestamp < CACHE_DURATION) {
            const sortedProducts = data.sort((a, b) => a.product_id - b.product_id);
            setProducts(sortedProducts);
            setFilteredProducts(sortedProducts);
            setLastRefreshTime(timestamp);
            setLoading(false);
            return;
          }
        }
      }

      // Fetch fresh data from API
      setLoading(true);
      const response = await api.get('/dashboard/products');
      const sortedProducts = (response.data || []).sort((a, b) => a.product_id - b.product_id);
      
      // Update state
      setProducts(sortedProducts);
      setFilteredProducts(sortedProducts);
      setLastRefreshTime(Date.now());
      
      // Cache the fresh data
      const cacheData = {
        data: sortedProducts,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      
    } catch (error) {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Refresh function for the refresh button
  const handleRefresh = async () => {
    try {
      setLoading(true);
      const response = await api.post('/dashboard/products/refresh');
      const sortedProducts = (response.data.data || []).sort((a, b) => a.product_id - b.product_id);
      
      // Update state
      setProducts(sortedProducts);
      setFilteredProducts(sortedProducts);
      setLastRefreshTime(Date.now());
      
      // Cache the fresh data
      const cacheData = {
        data: sortedProducts,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      
      message.success(response.data.message || 'Products refreshed successfully');
    } catch (error) {
      if (error.response?.status === 429) {
        // Rate limited
        const retryAfter = error.response.data?.retryAfter || 60;
        message.error(`Too many refresh requests. Please wait ${retryAfter} seconds.`);
      } else {
        message.error('Failed to refresh products');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Debounced search with performance optimization
  const debouncedSearch = useCallback((searchValue) => {
  if (searchTimeoutRef.current) {
    clearTimeout(searchTimeoutRef.current);
  }

  searchTimeoutRef.current = setTimeout(() => {
    if (!searchValue.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product =>
      product.product_name
        .toLowerCase()
        .includes(searchValue.toLowerCase())
    );

    setFilteredProducts(filtered);
  }, 800); // 800ms debounce
}, [products]);

  // Handle search input changes - immediate UI update, debounced state update
  const handleSearch = useCallback((value) => {
    // Update search term immediately for responsive typing
    setSearchTerm(value);
    
    // Debounce the actual search logic
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Memoized filtered products to prevent unnecessary recalculations

  const handleCreate = () => {
    setEditingProduct(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setModalVisible(true);
    form.setFieldsValue({
      product_name: product.product_name,
      category_id: product.category_id
    });
  };

  const handleDelete = async (productId) => {
    try {
      await api.delete(`/dashboard/products/${productId}`);
      setToast({ open: true, message: 'Product deleted successfully!', severity: 'success' });
      localStorage.removeItem(CACHE_KEY); // Clear cache after deletion
      fetchProducts();
      // Hide toast after 2.5 seconds
      setTimeout(() => {
        setToast({ open: false, message: '', severity: 'success' });
      }, 2500);
    } catch (error) {
      setToast({ open: true, message: 'Failed to delete product', severity: 'error' });
      setTimeout(() => {
        setToast({ open: false, message: '', severity: 'success' });
      }, 2500);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      if (editingProduct) {
        await api.put(`/dashboard/update-product/${editingProduct.product_id}`, values);
        setToast({ open: true, message: 'Product updated successfully!', severity: 'success' });
        setModalVisible(false);
        form.resetFields();
        setEditingProduct(null);
        localStorage.removeItem(CACHE_KEY); // Clear cache after update
        fetchProducts();
        // Hide toast after 2.5 seconds
        setTimeout(() => {
          setToast({ open: false, message: '', severity: 'success' });
        }, 2500);
      } else {
        // Create basic product first
        console.log('Creating product with values:', values);
        const response = await api.post('/dashboard/create-product', values);
        console.log('Product creation response:', response.data);
        
        // Show custom toast
        setToast({ open: true, message: 'Product created successfully!', severity: 'success' });
        
        // Store the created product ID and show variants modal
        setCreatedProductId(response.data.product_id);
        setModalVisible(false);
        form.resetFields();
        
        // Delay before showing variants modal
        setTimeout(() => {
          setVariantsModalVisible(true);
          setToast({ open: false, message: '', severity: 'success' });
        }, 1500);
      }
    } catch (error) {
      message.error(`Failed to ${editingProduct ? 'update' : 'create'} product`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVariantsSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Validate variants before submission
      if (variants.length === 0) {
        setToast({ open: true, message: 'Please add at least one variant', severity: 'error' });
        setTimeout(() => {
          setToast({ open: false, message: '', severity: 'success' });
        }, 2500);
        return;
      }
      
      // Validate each variant has required fields
      const invalidVariants = variants.filter(v => {
  const price = Number(v.price);
  return !v.size_label || isNaN(price) || price <= 0;
});

      if (invalidVariants.length > 0) {
        setToast({ open: true, message: 'All variants must have a size and valid price', severity: 'error' });
        setTimeout(() => {
          setToast({ open: false, message: '', severity: 'success' });
        }, 2500);
        return;
      }
      
      // Create variants for product
      for (const variant of variants) {
        await api.post(`/dashboard/products/${createdProductId}/variants`, {
          size_label: variant.size_label,
          price: Number(variant.price),
          is_default: variant.is_default || false
        });
      }

      
      setToast({ open: true, message: 'Variants added successfully!', severity: 'success' });
      setVariantsModalVisible(false);
      setVariants([]);
      setCreatedProductId(null);
      localStorage.removeItem(CACHE_KEY); // Clear cache after adding variants
      fetchProducts();
      // Hide toast after 2.5 seconds
      setTimeout(() => {
        setToast({ open: false, message: '', severity: 'success' });
      }, 2500);
    } catch (error) {
      console.error('Variants submission error:', error);
      message.error('Failed to add variants: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPrice = (product, variant) => {
    setEditingVariant({ product, variant });
    setPriceEditModalVisible(true);
  };

  const handlePriceUpdate = async (values) => {
    try {
      setSubmitting(true);
      await api.put(`/products/${editingVariant.product.product_id}/variants/${editingVariant.variant.variant_id}/price`, {
        price: Number(values.price)
      });
      
      setToast({ open: true, message: 'Price updated successfully!', severity: 'success' });
      setPriceEditModalVisible(false);
      setEditingVariant(null);
      localStorage.removeItem(CACHE_KEY); // Clear cache after price update
      fetchProducts();
      setTimeout(() => {
        setToast({ open: false, message: '', severity: 'success' });
      }, 2500);
    } catch (error) {
      message.error('Failed to update price: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Performance optimized variant change handler with minimal debouncing
  

  const columns = [
    { 
      title: 'Product ID', 
      dataIndex: 'product_id', 
      key: 'product_id', 
      width: 100,
      render: (text) => <Text style={{ color: '#f3f4f6' }}>{text}</Text>
    },
    { 
      title: 'Product Name', 
      dataIndex: 'product_name', 
      key: 'product_name', 
      ellipsis: true,
      render: (text) => <Text style={{ color: '#f3f4f6' }}>{text}</Text>
    },
    { 
      title: 'Category', 
      dataIndex: 'category_name', 
      key: 'category_name', 
      width: 120,
      render: (text) => <Text style={{ color: '#ffffff' }}>{text}</Text>
    },
 
    {
      title: 'Variants',
      dataIndex: 'variants',
      key: 'variants',
      width: 280,
      render: (variants, record) => (
        <div>
          {variants && variants.length > 0 ? (
            variants.map((variant, index) => (
              <div key={variant.variant_id} style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag 
                  style={{ 
                    fontSize: '12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: '#3b82f6',
                    color: '#93c5fd'
                  }}
                >
                  {variant.size_label}
                </Tag>
                <Text style={{ color: '#f3f4f6', fontSize: '12px' }}>
                  ₱{parseFloat(variant.price || 0).toFixed(2)}
                </Text>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEditPrice(record, variant)}
                  style={{ 
                    fontSize: '10px',
                    padding: '2px 6px',
                    height: '20px',
                    color: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    borderRadius: '4px'
                  }}
                  title="Edit price"
                />
                {variant.is_default && (
                  <Tag 
                    style={{ 
                      fontSize: '10px', 
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      borderColor: '#10b981',
                      color: '#6ee7b7'
                    }}
                  >
                    Default
                  </Tag>
                )}
              </div>
            ))
          ) : (
            <Text style={{ color: '#9ca3af', fontSize: '12px' }}>No variants</Text>
          )}
        </div>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      fixed: 'right',
      onCell: () => ({ style: { backgroundColor: '#1f2937' } }),
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ 
              backgroundColor: '#10b981', 
              borderColor: '#10b981',
              fontWeight: 500,
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
              color: '#ffffff'
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this product?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.product_id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ style: { backgroundColor: '#ef4444', borderColor: '#ef4444' } }}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              style={{ 
                fontWeight: 500,
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                color: '#ffffff',
                backgroundColor: '#dc2626',
                borderColor: '#dc2626'
              }}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Check authentication and fetch data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!userData || !token) {
          navigate('/login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // If user is not admin, redirect to appropriate dashboard
        if (parsedUser.u_role !== 'admin') {
          navigate(parsedUser.u_role === 'cashier' ? '/landingpage' : '/');
          return;
        }

        await fetchProducts();
      } catch (error) {
        console.error('Authentication error:', error);
        navigate('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (authLoading) {
    return (
      <div className="dashboard-dark" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f172a'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ marginBottom: 16 }} />
          <Text style={{ color: '#9ca3af' }}>Loading...</Text>
        </div>
      </div>
    );
  }

  const totalProducts = products.length;
  const inStockProducts = products.filter(item => item.stock_quantity > 10).length;
  const lowStockProducts = products.filter(item => item.stock_quantity > 0 && item.stock_quantity <= 10).length;
  const outOfStockProducts = products.filter(item => item.stock_quantity === 0).length;

  return (
    <div className="dashboard-dark" style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      padding: '0'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#1f2937',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid #374151'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setSidebarOpen(true)}
              style={{
                color: '#3b82f6',
                border: 'none',
                marginRight: '16px',
                fontSize: '18px',
                padding: '8px',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                transition: 'all 0.3s ease'
              }}
              className="hamburger-menu-btn"
            />
            <Title level={3} style={{ margin: 0, color: '#3b82f6' }}>
              Product Management
            </Title>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              backgroundColor: '#374151',
              padding: '8px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #4b5563'
            }}>
              <UserOutlined style={{ marginRight: '8px', color: '#3b82f6' }} />
              <Text strong style={{ color: '#f3f4f6' }}>
                {user?.full_name || user?.username || 'Admin'}
              </Text>
            </div>
            
            <Button 
              type="primary" 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px'
      }}>
        {/* Welcome Section */}
        <Card style={{ 
          marginBottom: '24px', 
          background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)', 
          borderColor: 'transparent', 
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{
                  width: '4px',
                  height: '32px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '2px',
                  marginRight: '12px'
                }} />
                <Title level={2} style={{ margin: 0, color: '#f3f4f6', fontWeight: '600' }}>
                  Product Inventory Management
                </Title>
              </div>
              <Text style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.4', marginLeft: '16px' }}>
                Create, update, and manage your product catalog with ease
              </Text>
            </div>
            <div style={{ 
              textAlign: 'right',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
              padding: '20px 24px',
              borderRadius: '12px',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '6px' }}>
                <InboxOutlined style={{ color: '#3b82f6', fontSize: '18px', marginRight: '8px' }} />
                <Text style={{ 
                  color: '#3b82f6', 
                  fontSize: '36px', 
                  fontWeight: '700', 
                  lineHeight: '1',
                  textShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                }}>
                  {totalProducts}
                </Text>
              </div>
              <Text style={{ 
                color: '#64748b', 
                fontSize: '13px', 
                display: 'block', 
                marginTop: '4px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Total Products
              </Text>
            </div>
          </div>
        </Card>

        {/* Products Table */}
        <Card 
          style={{ 
            background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)', 
            borderColor: 'transparent', 
            borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.1)'
          }}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '3px',
                  height: '24px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '2px',
                  marginRight: '12px'
                }} />
                <Space>
                  <InboxOutlined style={{ color: '#3b82f6', fontSize: '20px' }} />
                  <Text strong style={{ color: '#f3f4f6', fontSize: '18px', fontWeight: '600' }}>
                    Products List
                  </Text>
                </Space>
              </div>
              <Input
                ref={searchInputRef}
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ 
                  width: '280px', 
                  background: 'rgba(55, 65, 81, 0.6)',
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                  color: '#f3f4f6',
                  marginRight: '20px',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}
                prefix={<InboxOutlined style={{ color: '#64748b' }} />}
              />
            </div>
          }
          extra={
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
                style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  borderColor: 'transparent',
                  borderRadius: '8px',
                  fontWeight: '500',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  border: 'none'
                }}
                title="Refresh products"
              >
                Refresh
              </Button>
              <Button
                type="primary"
                onClick={handleCreate}
                style={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderColor: 'transparent',
                  borderRadius: '8px',
                  fontWeight: '500',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  border: 'none'
                }}
              >
                <PlusOutlined style={{ marginRight: '6px' }} />
                Add Product
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredProducts}
            loading={loading}
            rowKey="product_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} products`,
              style: { color: '#9ca3af' }
            }}
            scroll={{ x: 'max-content' }}
            style={{ color: '#f3f4f6' }}
          />
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          className="dashboard-modal"
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editingProduct ? <EditOutlined style={{ color: '#3b82f6', fontSize: '18px' }} /> : <PlusOutlined style={{ color: '#10b981', fontSize: '18px' }} />}
              <span style={{ color: '#f3f4f6', fontSize: '16px', fontWeight: 'bold' }}>
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </span>
            </div>
          }
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
            setEditingProduct(null);
          }}
          footer={null}
          width={600}
          centered
          closable={true}
          styles={{
            body: { 
              backgroundColor: '#0f172a', 
              color: '#f3f4f6', 
              padding: '16px',
              borderRadius: '8px'
            },
            header: { 
              backgroundColor: '#0f172a', 
              borderBottom: '1px solid #374151',
              borderRadius: '8px 8px 0 0',
              padding: '16px 20px'
            },
            content: { 
              backgroundColor: '#0f172a', 
              color: '#f3f4f6',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid #374151'
            },
            mask: { 
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)'
            }
          }}
          wrapClassName="dark-modal-wrapper"
          zIndex={1000}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="product_name"
              label="Product Name"
              rules={[{ required: true, message: 'Please enter product name' }]}
            >
              <Input placeholder="Enter product name" style={{ backgroundColor: '#374151', borderColor: '#4b5563', color: '#f3f4f6', borderRadius: '6px' }} />
            </Form.Item>

            <Form.Item
              name="category_id"
              label="Category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select placeholder="Select category" style={{ color: '#f3f4f6' }}>
                {memoizedCategories.map(cat => (
                  <Option key={cat.id} value={cat.id}>
                    {cat.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                  setEditingProduct(null);
                }}>
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={submitting}
                  style={{ backgroundColor: editingProduct ? '#3b82f6' : '#10b981', borderColor: editingProduct ? '#3b82f6' : '#10b981' }}
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Variants Modal */}
        <VariantsModal
          open={variantsModalVisible}
          onClose={() => {
            setVariantsModalVisible(false);
            setVariants([]);
            setCreatedProductId(null);
          }}
          variants={variants}
          setVariants={setVariants}
          submitting={submitting}
          onSubmit={handleVariantsSubmit}
        />

        {/* Price Edit Modal */}
        <Modal
          className="dashboard-modal"
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <EditOutlined style={{ color: '#3b82f6', fontSize: '18px' }} />
              <span style={{ color: '#f3f4f6', fontSize: '16px', fontWeight: 'bold' }}>
                Edit Variant Price
              </span>
            </div>
          }
          open={priceEditModalVisible}
          onCancel={() => {
            setPriceEditModalVisible(false);
            setEditingVariant(null);
          }}
          footer={null}
          width={400}
          centered
          closable={true}
          styles={{
            body: { 
              backgroundColor: '#0f172a', 
              color: '#f3f4f6', 
              padding: '16px',
              borderRadius: '8px'
            },
            header: { 
              backgroundColor: '#0f172a', 
              borderBottom: '1px solid #374151',
              borderRadius: '8px 8px 0 0',
              padding: '16px 20px'
            },
            content: { 
              backgroundColor: '#0f172a', 
              color: '#f3f4f6',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid #374151'
            },
            mask: { 
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)'
            }
          }}
          wrapClassName="dark-modal-wrapper"
          zIndex={1000}
        >
          {editingVariant && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <Text style={{ color: '#9ca3af', fontSize: '14px' }}>Product:</Text>
                <div style={{ marginTop: '4px' }}>
                  <Text strong style={{ color: '#f3f4f6', fontSize: '16px' }}>
                    {editingVariant.product.product_name}
                  </Text>
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <Text style={{ color: '#9ca3af', fontSize: '14px' }}>Variant:</Text>
                <div style={{ marginTop: '4px' }}>
                  <Tag 
                    style={{ 
                      fontSize: '14px',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      borderColor: '#3b82f6',
                      color: '#93c5fd'
                    }}
                  >
                    {editingVariant.variant.size_label}
                  </Tag>
                  <Text style={{ color: '#f3f4f6', fontSize: '14px', marginLeft: '8px' }}>
                    Current price: ₱{parseFloat(editingVariant.variant.price || 0).toFixed(2)}
                  </Text>
                </div>
              </div>

              <Form
                layout="vertical"
                onFinish={handlePriceUpdate}
                initialValues={{
                  price: parseFloat(editingVariant.variant.price || 0).toFixed(2)
                }}
              >
                <Form.Item
                  name="price"
                  label="New Price"
                  rules={[
                    { required: true, message: 'Please enter a price' },
                    { 
                      validator: (_, value) => {
                        if (value && (isNaN(value) || parseFloat(value) <= 0)) {
                          return Promise.reject('Price must be a positive number');
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    prefix="₱"
                    placeholder="Enter new price"
                    style={{ 
                      backgroundColor: '#374151', 
                      borderColor: '#4b5563', 
                      color: '#f3f4f6', 
                      borderRadius: '6px' 
                    }}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                  <Space>
                    <Button onClick={() => {
                      setPriceEditModalVisible(false);
                      setEditingVariant(null);
                    }}>
                      Cancel
                    </Button>
                    <Button 
                      type="primary" 
                      htmlType="submit"
                      loading={submitting}
                      style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
                    >
                      Update Price
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          )}
        </Modal>

      </div>

      {/* Custom Toast */}
      <Toast 
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ open: false, message: '', severity: 'success' })}
      />

      {/* Mobile Sidebar */}
      <OverlaySidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />
      {sidebarOpen && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: window.innerWidth <= 768 ? 'block' : 'none'
          }}
        />
      )}
    </div>
  );
};

export default ProductPage;
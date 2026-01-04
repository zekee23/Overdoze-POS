import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  InputNumber,
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
  const [form] = Form.useForm();
  const [variantsForm] = Form.useForm();
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
    { id: 11, name: 'OD' +'s after hours' },
    { id: 12, name: 'Protein(Iced/Ice Blend' }
  ];

  // Memoize categories to prevent unnecessary re-renders
  const memoizedCategories = useMemo(() => categories, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/products');
      const sortedProducts = (response.data || []).sort((a, b) => a.product_id - b.product_id);
      setProducts(sortedProducts);
      setFilteredProducts(sortedProducts);
    } catch (error) {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Refresh function for the refresh button
  const handleRefresh = async () => {
    try {
      await fetchProducts();
      message.success('Products refreshed successfully');
    } catch (error) {
      message.error('Failed to refresh products');
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
    // Update the search term state only after debounce
    setSearchTerm(searchValue);
    
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
    // Update input value immediately for responsive typing
    if (searchInputRef.current) {
      searchInputRef.current.value = value;
    }
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
      message.success('Product deleted successfully!');
      fetchProducts();
    } catch (error) {
      message.error('Failed to delete product');
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      if (editingProduct) {
        await api.put(`/dashboard/update-product/${editingProduct.product_id}`, values);
        message.success('Product updated successfully!');
        setModalVisible(false);
        form.resetFields();
        setEditingProduct(null);
        fetchProducts();
      } else {
        // Create basic product first
        const response = await api.post('/dashboard/create-product', values);
        message.success('Product created successfully!');
        
        // Store the created product ID and show variants modal
        setCreatedProductId(response.data.product_id);
        setModalVisible(false);
        form.resetFields();
        setVariantsModalVisible(true);
      }
    } catch (error) {
      message.error(`Failed to ${editingProduct ? 'update' : 'create'} product`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVariantsSubmit = async (values) => {
    try {
      setSubmitting(true);
      
      // Create variants for the product
      for (const variant of values.variants) {
        await api.post(`/dashboard/products/${createdProductId}/variants`, {
          size_label: variant.size_label,
          price: variant.price,
          is_default: variant.is_default || false
        });
      }
      
      message.success('Variants added successfully!');
      setVariantsModalVisible(false);
      setVariantsForm.resetFields();
      setVariants([]);
      setCreatedProductId(null);
      fetchProducts();
    } catch (error) {
      message.error('Failed to add variants');
    } finally {
      setSubmitting(false);
    }
  };

  // Performance optimized variant change handler with minimal debouncing
  const handleVariantChange = useCallback((key, field, value) => {
    // Update state immediately for responsive typing
    setVariants(prevVariants => 
      prevVariants.map(v => 
        v.key === key ? { ...v, [field]: value } : v
      )
    );
  }, []);

  // Optimized variant management functions
  const handleAddVariant = useCallback(() => {
    const newVariant = {
      key: Date.now() + Math.random(), // More unique key
      size_label: '',
      price: 0,
      is_default: false
    };
    setVariants(prev => [...prev, newVariant]);
  }, []);

  const handleRemoveVariant = useCallback((key) => {
    setVariants(prev => prev.filter(v => v.key !== key));
  }, []);

  // Simplified variant component for better typing performance
  const VariantCard = ({ variant, onChange, onRemove }) => {
    return (
      <Card
        key={variant.key}
        size="small"
        style={{ 
          marginBottom: '16px', 
          backgroundColor: '#ffff', 
          borderColor: '#4b5563',
          borderRadius: '8px'
        }}
      >
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Select
              placeholder="Select Size"
              value={variant.size_label}
              onChange={(value) => onChange(variant.key, 'size_label', value)}
              style={{ 
                width: '100%',
                backgroundColor: '#fffff', 
                borderColor: '#4b5563', 
                color: '#333',
                borderRadius: '6px'
              }}
            >
              <Option value="16oz">16oz</Option>
              <Option value="22oz">22oz</Option>
            </Select>
          </Col>
          <Col span={8}>
            <InputNumber
              placeholder="Price"
              value={variant.price}
              onChange={(value) => onChange(variant.key, 'price', value)}
              style={{ 
                width: '100%', 
                backgroundColor: '#fffff', 
                borderColor: '#4b5563', 
                color: '#e5e7eb',
                borderRadius: '6px'
              }}
              min={0}
              step={0.01}
              precision={2}
              formatter={value => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₱\s?|(,*)/g, '')}
            />
          </Col>
          <Col span={6}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', backgroundColor: '#1f2937', borderRadius: '6px' }}>
              <input
                type="checkbox"
                checked={variant.is_default}
                onChange={(e) => onChange(variant.key, 'is_default', e.target.checked)}
                style={{ 
                  marginRight: '8px',
                  backgroundColor: '#4b5563',
                  borderColor: '#6b7280'
                }}
              />
              <Text style={{ color: '#e5e7eb', fontWeight: 500 }}>Default</Text>
            </div>
          </Col>
          <Col span={2}>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onRemove(variant.key)}
              style={{ 
                color: '#ef4444',
                backgroundColor: '#374151',
                borderColor: '#4b5563',
                borderRadius: '6px'
              }}
            />
          </Col>
        </Row>
      </Card>
    );
  };

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
      render: (text) => <Text style={{ color: '#9ca3af' }}>{text}</Text>
    },
 
    {
      title: 'Variants',
      dataIndex: 'variants',
      key: 'variants',
      width: 200,
      render: (variants) => (
        <div>
          {variants && variants.length > 0 ? (
            variants.map((variant, index) => (
              <div key={variant.variant_id} style={{ marginBottom: '4px' }}>
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
                {variant.is_default && (
                  <Tag 
                    style={{ 
                      fontSize: '10px', 
                      marginLeft: '4px',
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
          backgroundColor: '#2d3748', 
          borderColor: '#4a5568', 
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={2} style={{ margin: 0, color: '#f3f4f6' }}>
                Product Inventory Management
              </Title>
              <Text style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.4' }}>
                Create, update, and manage your product catalog with ease
              </Text>
            </div>
            <button style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
              Add starting cash
            </button>
          </div>
        </Card>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card 
              style={{ 
                backgroundColor: '#1e40af', 
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Statistic
                title="Total Products"
                value={totalProducts}
                valueStyle={{ color: '#fff', fontSize: '32px' }}
                prefix={<InboxOutlined style={{ color: '#bfdbfe' }} />}
              />
              <Text style={{ color: '#bfdbfe', fontSize: '14px', marginTop: '8px', display: 'block' }}>
                All products in inventory
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card 
              style={{ 
                backgroundColor: '#065f46', 
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Statistic
                title="In Stock"
                value={inStockProducts}
                valueStyle={{ color: '#fff', fontSize: '32px' }}
                prefix={<ShoppingOutlined style={{ color: '#bbf7d0' }} />}
              />
              <Text style={{ color: '#bbf7d0', fontSize: '14px', marginTop: '8px', display: 'block' }}>
                Products with adequate stock
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card 
              style={{ 
                backgroundColor: '#9d174d', 
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Statistic
                title="Low Stock"
                value={lowStockProducts}
                valueStyle={{ color: '#fff', fontSize: '32px' }}
                prefix={<ReloadOutlined style={{ color: '#fbcfe8' }} />}
              />
              <Text style={{ color: '#fbcfe8', fontSize: '14px', marginTop: '8px', display: 'block' }}>
                Items need restocking soon
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card 
              style={{ 
                backgroundColor: '#991b1b', 
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Statistic
                title="Out of Stock"
                value={outOfStockProducts}
                valueStyle={{ color: '#fff', fontSize: '32px' }}
                prefix={<DeleteOutlined style={{ color: '#fecaca' }} />}
              />
              <Text style={{ color: '#fecaca', fontSize: '14px', marginTop: '8px', display: 'block' }}>
                Products unavailable
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Products Table */}
        <Card 
          style={{ 
            backgroundColor: '#2d3748', 
            borderColor: '#4a5568', 
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Space>
                <InboxOutlined style={{ color: '#3b82f6', fontSize: '20px' }} />
                <Text strong style={{ color: '#f3f4f6', fontSize: '18px' }}>
                  Products List
                </Text>
              </Space>
              <Input
                ref={searchInputRef}
                placeholder="Search products..."
                defaultValue={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ 
                  width: '250px', 
                  backgroundColor: '#374151',
                  borderColor: '#4b5563',
                  color: '#f3f4f6',
                  marginRight: '20px',
                }}
              />
            </div>
          }
          extra={
            <Button
              type="primary"
              onClick={handleCreate}
              style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
            >
              Add Product
            </Button>
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
          title={
            <Space>
              {editingProduct ? <EditOutlined style={{ color: '#3b82f6' }} /> : <PlusOutlined style={{ color: '#10b981' }} />}
              <span>{editingProduct ? 'Edit Product' : 'Create New Product'}</span>
            </Space>
          }
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
            setEditingProduct(null);
          }}
          footer={null}
          width={600}
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
              <Input placeholder="Enter product name" style={{ backgroundColor: '#ffffff', borderColor: '#4b5563', color: '#333', borderRadius: '6px' }} />
            </Form.Item>

            <Form.Item
              name="category_id"
              label="Category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select placeholder="Select category" style={{ color: '#333' }}>
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
        <Modal
          title={
            <Space>
              <PlusOutlined style={{ color: '#10b981' }} />
              <span>Add Product Variants</span>
            </Space>
          }
          open={variantsModalVisible}
          onCancel={() => {
            setVariantsModalVisible(false);
            setVariantsForm.resetFields();
            setVariants([]);
            setCreatedProductId(null);
          }}
          footer={null}
          width={800}
        >
          <div style={{ marginBottom: '16px' }}>
            <Text style={{ color: '#333', fontSize: '14px', fontWeight: 500 }}>
              Add variants for your product. Each variant can have different sizes and prices.
            </Text>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Button
              type="dashed"
              onClick={handleAddVariant}
              icon={<PlusOutlined />}
              style={{ width: '100%' }}
            >
              Add Variant
            </Button>
          </div>

          {variants.map((variant) => (
            <VariantCard 
              key={variant.key} 
              variant={variant} 
              onChange={handleVariantChange}
              onRemove={handleRemoveVariant}
            />
          ))}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: '24px' }}>
            <Space>
              <Button onClick={() => {
                setVariantsModalVisible(false);
                setVariantsForm.resetFields();
                setVariants([]);
                setCreatedProductId(null);
              }}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                onClick={() => handleVariantsSubmit({ variants })}
                loading={submitting}
                disabled={variants.length === 0}
                style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
              >
                Save Variants
              </Button>
            </Space>
          </Form.Item>
        </Modal>
      </div>

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
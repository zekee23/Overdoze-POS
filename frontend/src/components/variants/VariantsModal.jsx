import { Modal, Button, Space, Card, Row, Col, Input, Select, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useCallback, memo } from 'react';

const { Text } = Typography;
const { Option } = Select;

const VariantCard = memo(({ variant, onChange, onRemove }) => {
  return (
    <Card
      size="small"
      style={{
        marginBottom: 16,
        backgroundColor: '#111827',
        borderColor: '#374151',
        borderRadius: 8,
        border: '1px solid #374151'
      }}
    >
      <Row gutter={16} align="middle">
        <Col span={8}>
          <Select
            placeholder="Select Size"
            value={variant.size_label}
            onChange={(v) => onChange(variant.key, 'size_label', v)}
            style={{
              width: '100%',
              backgroundColor: '#1f2937',
              color: '#f3f4f6',
              borderColor: '#374151'
            }}
            dropdownStyle={{
              backgroundColor: '#1f2937',
              borderColor: '#374151'
            }}
          >
            <Option value="Standard">Standard</Option>
            <Option value="16oz">16oz</Option>
            <Option value="22oz">22oz</Option>
          </Select>
        </Col>

        <Col span={8}>
          <Input
            placeholder="Price"
            value={variant.price}
            onChange={(e) =>
              onChange(variant.key, 'price', e.target.value)
            }
            style={{
              backgroundColor: '#1f2937',
              borderColor: '#374151',
              color: '#f3f4f6',
              borderRadius: 6
            }}
          />
        </Col>

        <Col span={6}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              backgroundColor: '#1f2937',
              borderRadius: 6,
              border: '1px solid #374151'
            }}
          >
            <input
              type="checkbox"
              checked={variant.is_default}
              onChange={(e) =>
                onChange(variant.key, 'is_default', e.target.checked)
              }
              style={{ marginRight: 8 }}
            />
            <Text style={{ color: '#f3f4f6', fontWeight: 500 }}>
              Default
            </Text>
          </div>
        </Col>

        <Col span={2}>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onRemove(variant.key)}
          />
        </Col>
      </Row>
    </Card>
  );
});

export default function VariantsModal({
  open,
  onClose,
  variants,
  setVariants,
  onSubmit,
  submitting
}) {
  const addVariant = useCallback(() => {
    setVariants(v => [
      ...v,
      {
        key: crypto.randomUUID(),
        size_label: '',
        price: '',
        is_default: false
      }
    ]);
  }, [setVariants]);

  const updateVariant = useCallback((key, field, value) => {
    setVariants(prev =>
      prev.map(v =>
        v.key === key ? { ...v, [field]: value } : v
      )
    );
  }, [setVariants]);

  const removeVariant = useCallback((key) => {
    setVariants(prev => prev.filter(v => v.key !== key));
  }, [setVariants]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={820}
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
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#f3f4f6', fontSize: '16px', fontWeight: 'bold' }}>
            Product Variants
          </span>
        </div>
      }
    >
      <Button
        block
        icon={<PlusOutlined />}
        onClick={addVariant}
        style={{
          marginBottom: 16,
          background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
          borderColor: '#3b82f6',
          color: '#fff',
          height: '40px',
          borderRadius: '6px',
          fontWeight: '500',
          border: 'none'
        }}
      >
        Add Variant
      </Button>

      {variants.map(v => (
        <VariantCard
          key={v.key}
          variant={v}
          onChange={updateVariant}
          onRemove={removeVariant}
        />
      ))}

      <Space style={{ justifyContent: 'flex-end', width: '100%', marginTop: 16 }}>
        <Button
          onClick={onClose}
          style={{
            backgroundColor: '#374151',
            color: '#f3f4f6',
            borderColor: '#4b5563',
            height: '36px',
            borderRadius: '6px',
            fontWeight: '500'
          }}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          loading={submitting}
          onClick={onSubmit}
          disabled={!variants.length}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
            borderColor: '#3b82f6',
            height: '36px',
            borderRadius: '6px',
            fontWeight: '500',
            border: 'none'
          }}
        >
          Save Variants
        </Button>
      </Space>
    </Modal>
  );
}

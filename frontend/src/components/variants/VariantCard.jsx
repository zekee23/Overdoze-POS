import { memo } from 'react';
import { Card, Row, Col, Input, Select, Button, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { SIZE_OPTIONS } from './constants';

const { Text } = Typography;

const VariantCard = memo(function VariantCard({ variant, onChange, onRemove }) {
  return (
    <Card
      size="small"
      style={{
        marginBottom: 16,
        backgroundColor: '#374151',
        borderColor: '#4b5563',
        borderRadius: 8
      }}
    >
      <Row gutter={16} align="middle">
        <Col span={8}>
          <Select
            value={variant.size_label}
            placeholder="Select Size"
            onChange={(v) => onChange(variant.key, 'size_label', v)}
            style={{ width: '100%' }}
          >
            {SIZE_OPTIONS.map(opt => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        </Col>

        <Col span={8}>
          <Input
            placeholder="Price"
            value={variant.price}
            onChange={(e) =>
              onChange(variant.key, 'price', e.target.value)
            }
          />
        </Col>

        <Col span={6}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={variant.is_default}
              onChange={(e) =>
                onChange(variant.key, 'is_default', e.target.checked)
              }
            />
            <Text>Default</Text>
          </label>
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

export default VariantCard;

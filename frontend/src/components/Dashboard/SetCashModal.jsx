import { Modal, Form, InputNumber, Button, Space, Typography } from 'antd';
import { modalStyles } from '../../constants/styles';

const { Text } = Typography;

const SetCashModal = ({ 
  visible, 
  onCancel, 
  onSubmit, 
  form 
}) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#10b981', fontSize: '18px' }}>₱</span>
          <span style={{ color: '#f3f4f6', fontSize: '16px', fontWeight: 'bold' }}>
            Set Starting Cash
          </span>
        </div>
      }
      open={visible}
      onCancel={() => {
        onCancel();
        form.resetFields();
      }}
      footer={null}
      width={480}
      centered
      closable={true}
      styles={modalStyles}
      wrapClassName="dark-modal-wrapper"
      zIndex={1000}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
      >
        <Form.Item
          name="startingCash"
          label="Starting Cash Amount"
          rules={[
            { required: true, message: 'Please enter starting cash amount' },
            { type: 'number', min: 0, message: 'Amount must be positive' }
          ]}
        >
          <InputNumber
            style={{ width: '100%', backgroundColor: '#374151', borderColor: '#4b5563', color: '#f3f4f6' }}
            formatter={(value) => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value.replace(/₱\s?|(,*)/g, '')}
            placeholder="0.00"
            precision={2}
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => {
              onCancel();
              form.resetFields();
            }}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
            >
              Set Cash
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SetCashModal;

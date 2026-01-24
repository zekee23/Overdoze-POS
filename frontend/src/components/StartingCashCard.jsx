import { useState, useEffect } from 'react';
import Card from 'antd/es/card';
import Button from 'antd/es/button';
import InputNumber from 'antd/es/input-number';
import Modal from 'antd/es/modal';
import message from 'antd/es/message';
import Statistic from 'antd/es/statistic';
import { DollarOutlined, PlusOutlined } from '@ant-design/icons';
import { cashDrawerAPI } from '../utils/api';

const StartingCashCard = () => {
  const [startingCash, setStartingCash] = useState(0);
  const [expectedCash, setExpectedCash] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState(0);
  const [hasStartingCash, setHasStartingCash] = useState(false);

  const fetchCashData = async () => {
    try {
      setLoading(true);
      const [startingCashRes, expectedCashRes] = await Promise.all([
        cashDrawerAPI.getTodayStartingCash(),
        cashDrawerAPI.getExpectedCashInDrawer()
      ]);

      setStartingCash(startingCashRes.data.starting_cash);
      setHasStartingCash(startingCashRes.data.exists);
      setExpectedCash(expectedCashRes.data.expected_cash);
      setTotalSales(expectedCashRes.data.total_sales);
    } catch (error) {
      console.error('Error fetching cash data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashData();
  }, []);

  const handleSetStartingCash = async () => {
    if (inputValue <= 0) {
      message.error('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      await cashDrawerAPI.setStartingCash(inputValue);
      message.success('Starting cash set successfully');
      setModalVisible(false);
      setInputValue(0);
      setHasStartingCash(true);
      fetchCashData();
    } catch (error) {
      if (error.response?.status === 400) {
        message.error(error.response.data.error || 'Starting cash already set for today');
      } else {
        message.error('Failed to set starting cash');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      variant="borderless" 
      style={{ 
        textAlign: 'center', 
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', 
        color: '#fff', 
        borderRadius: '12px', 
        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.25)',
        position: 'relative',
        minHeight: '140px'
      }}
    >
      <Statistic
        title={<span style={{ color: '#fff', fontSize: '14px' }}>Starting Cash</span>}
        value={startingCash}
        precision={2}
        prefix="PHP"
        loading={loading}
        styles={{ content: { color: '#fff', fontSize: '24px', fontWeight: 'bold' } }}
      />
      
      {!hasStartingCash && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="small"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            color: '#fff'
          }}
          onClick={() => setModalVisible(true)}
        >
          Set
        </Button>
      )}

      <Modal
        title="Set Starting Cash"
        open={modalVisible}
        onOk={handleSetStartingCash}
        onCancel={() => {
          setModalVisible(false);
          setInputValue(0);
        }}
        confirmLoading={loading}
        okText="Set Starting Cash"
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ marginBottom: '16px' }}>
            Enter the starting cash amount for today ({new Date().toLocaleDateString()}):
          </p>
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Enter amount"
            value={inputValue}
            onChange={setInputValue}
            min={0}
            precision={2}
            formatter={value => `PHP ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/PHP\s?|(,*)/g, '')}
          />
        </div>
      </Modal>
    </Card>
  );
};

export default StartingCashCard;

import { useState, useEffect } from 'react';
import Card from 'antd/es/card';
import Statistic from 'antd/es/statistic';
import { WalletOutlined } from '@ant-design/icons';
import { cashDrawerAPI } from '../utils/api';

const TotalMoneyCard = ({ totalSales }) => {
  const [startingCash, setStartingCash] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchStartingCash = async () => {
    try {
      setLoading(true);
      const response = await cashDrawerAPI.getTodayStartingCash();
      setStartingCash(response.data.starting_cash);
    } catch (error) {
      console.error('Error fetching starting cash:', error);
      setStartingCash(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartingCash();
  }, []);

  const totalMoney = startingCash + totalSales;

  return (
    <Card 
      variant="borderless" 
      style={{ 
        textAlign: 'center', 
        background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', 
        color: '#fff', 
        borderRadius: '12px', 
        boxShadow: '0 4px 20px rgba(6, 182, 212, 0.25)',
        minHeight: '140px'
      }}
    >
      <Statistic
        title={<span style={{ color: '#fff', fontSize: '14px' }}>Total Money for Today</span>}
        value={totalMoney}
        precision={2}
        prefix={<WalletOutlined />}
        suffix="PHP"
        loading={loading}
        styles={{ content: { color: '#fff', fontSize: '24px', fontWeight: 'bold' } }}
      />
    </Card>
  );
};

export default TotalMoneyCard;

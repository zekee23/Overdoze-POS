import { Spin } from 'antd';

const LoadingSpinner = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <Spin size="large" tip="Loading..." />
    </div>
  );
};

export default LoadingSpinner;

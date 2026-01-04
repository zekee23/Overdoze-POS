import React from 'react';
import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

/**
 * RateLimitedRefreshButton component
 * Automatically adds rate limiting to any refresh button
 * 
 * @param {Object} props
 * @param {Function} props.onRefresh - The refresh function to call
 * @param {string} props.operationKey - Unique key for this refresh operation
 * @param {number} props.delay - Rate limit delay in milliseconds
 * @param {boolean} props.loading - Loading state
 * @param {Object} props.buttonProps - Additional button props
 * @param {Object} props.rateLimitHook - The useRefreshRateLimit hook instance
 */
const RateLimitedRefreshButton = ({
  onRefresh,
  operationKey,
  delay = 2000,
  loading = false,
  buttonProps = {},
  rateLimitHook,
  children = 'Refresh',
  icon = <ReloadOutlined />
}) => {
  const {
    rateLimitedRefresh,
    isRateLimited,
    timeRemaining,
    canRefresh
  } = rateLimitHook;

  const handleClick = async () => {
    try {
      await rateLimitedRefresh(operationKey, onRefresh, { delay });
    } catch (error) {
      // Handle rate limit errors silently or let parent handle them
      if (!error.isRateLimit) {
        console.error('Refresh failed:', error);
      }
    }
  };

  const isDisabled = isRateLimited || loading || !canRefresh(operationKey, delay);
  const buttonText = isRateLimited 
    ? `Wait ${Math.ceil(timeRemaining / 1000)}s` 
    : children;

  return (
    <Button
      type="primary"
      icon={icon}
      onClick={handleClick}
      loading={loading || isRateLimited}
      disabled={isDisabled}
      style={{
        backgroundColor: isRateLimited ? '#d9d9d9' : '#3b82f6',
        borderColor: isRateLimited ? '#d9d9d9' : '#3b82f6',
        ...buttonProps.style
      }}
      title={
        isRateLimited 
          ? `Please wait ${Math.ceil(timeRemaining / 1000)} seconds before refreshing`
          : `Refresh ${operationKey} data`
      }
      {...buttonProps}
    >
      {buttonText}
    </Button>
  );
};

export default RateLimitedRefreshButton;

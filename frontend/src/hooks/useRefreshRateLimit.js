import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook specifically for rate limiting refresh button API calls
 * Prevents users from spamming refresh buttons and overwhelming the backend
 */
export const useRefreshRateLimit = (options = {}) => {
  const {
    defaultDelay = 2000, // 2 seconds default between refreshes
    maxRetries = 3,
    backoffMultiplier = 1.5
  } = options;

  const [isRateLimited, setIsRateLimited] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  
  // Track last refresh times for different operations
  const lastRefreshTimes = useRef(new Map());
  const timeoutRefs = useRef(new Map());
  const retryTimeouts = useRef(new Map());

  /**
   * Rate limited refresh function for API calls
   * @param {string} operationKey - Unique key for the refresh operation (e.g., 'orders', 'products', 'dashboard')
   * @param {Function} apiCall - The API function to call
   * @param {Object} options - Options for this specific refresh
   * @returns {Promise} Result of the API call
   */
  const rateLimitedRefresh = useCallback(async (operationKey, apiCall, refreshOptions = {}) => {
    const {
      delay = defaultDelay,
      showRetry = false,
      customErrorMessage = null
    } = refreshOptions;

    const now = Date.now();
    const lastRefresh = lastRefreshTimes.current.get(operationKey) || 0;
    const timeSinceLastRefresh = now - lastRefresh;

    // Check if we're rate limited
    if (timeSinceLastRefresh < delay) {
      const remaining = delay - timeSinceLastRefresh;
      setTimeRemaining(remaining);
      setIsRateLimited(true);
      
      // Auto-clear rate limit state after delay
      const existingTimeout = timeoutRefs.current.get(operationKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      const timeout = setTimeout(() => {
        setIsRateLimited(false);
        setTimeRemaining(0);
        timeoutRefs.current.delete(operationKey);
      }, remaining);
      
      timeoutRefs.current.set(operationKey, timeout);
      
      const error = new Error(`Rate limited. Please wait ${Math.ceil(remaining / 1000)} seconds.`);
      error.isRateLimit = true;
      error.timeRemaining = remaining;
      throw error;
    }

    try {
      // Update last refresh time
      lastRefreshTimes.current.set(operationKey, now);
      setIsRateLimited(false);
      setTimeRemaining(0);
      setRetryCount(0);

      // Make the API call
      const result = await apiCall();
      
      // Reset retry count on success
      setRetryCount(0);
      
      return result;
    } catch (error) {
      // Handle retry logic for failed API calls
      if (showRetry && retryCount < maxRetries && !error.isRateLimit) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        
        const retryDelay = delay * Math.pow(backoffMultiplier, newRetryCount - 1);
        
        const retryTimeout = setTimeout(() => {
          // Auto retry
          rateLimitedRefresh(operationKey, apiCall, refreshOptions);
        }, retryDelay);
        
        retryTimeouts.current.set(operationKey, retryTimeout);
        
        const retryError = new Error(
          customErrorMessage || `Request failed. Retrying... (${newRetryCount}/${maxRetries})`
        );
        retryError.isRetry = true;
        retryError.retryCount = newRetryCount;
        throw retryError;
      }
      
      throw error;
    }
  }, [defaultDelay, maxRetries, backoffMultiplier, retryCount]);

  /**
   * Check if a refresh operation can be called immediately
   * @param {string} operationKey - Unique key for the refresh operation
   * @param {number} delay - Custom delay for this operation
   * @returns {boolean} Whether the operation can be called immediately
   */
  const canRefresh = useCallback((operationKey, delay = defaultDelay) => {
    const now = Date.now();
    const lastRefresh = lastRefreshTimes.current.get(operationKey) || 0;
    const timeSinceLastRefresh = now - lastRefresh;
    return timeSinceLastRefresh >= delay;
  }, [defaultDelay]);

  /**
   * Get time remaining until next allowed refresh
   * @param {string} operationKey - Unique key for the refresh operation
   * @param {number} delay - Custom delay for this operation
   * @returns {number} Milliseconds remaining until next allowed refresh
   */
  const getTimeRemaining = useCallback((operationKey, delay = defaultDelay) => {
    const now = Date.now();
    const lastRefresh = lastRefreshTimes.current.get(operationKey) || 0;
    const timeSinceLastRefresh = now - lastRefresh;
    return Math.max(0, delay - timeSinceLastRefresh);
  }, [defaultDelay]);

  /**
   * Clear rate limit for a specific operation
   * @param {string} operationKey - Unique key for the refresh operation
   */
  const clearRateLimit = useCallback((operationKey) => {
    lastRefreshTimes.current.delete(operationKey);
    
    const timeout = timeoutRefs.current.get(operationKey);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(operationKey);
    }
    
    const retryTimeout = retryTimeouts.current.get(operationKey);
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeouts.current.delete(operationKey);
    }
    
    setIsRateLimited(false);
    setTimeRemaining(0);
    setRetryCount(0);
  }, []);

  /**
   * Clear all rate limits and timeouts
   */
  const clearAllRateLimits = useCallback(() => {
    lastRefreshTimes.current.clear();
    
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
    
    retryTimeouts.current.forEach(timeout => clearTimeout(timeout));
    retryTimeouts.current.clear();
    
    setIsRateLimited(false);
    setTimeRemaining(0);
    setRetryCount(0);
  }, []);

  /**
   * Reset retry count for a specific operation
   * @param {string} operationKey - Unique key for the refresh operation
   */
  const resetRetryCount = useCallback((operationKey) => {
    const retryTimeout = retryTimeouts.current.get(operationKey);
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeouts.current.delete(operationKey);
    }
    setRetryCount(0);
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    retryTimeouts.current.forEach(timeout => clearTimeout(timeout));
  }, []);

  return {
    rateLimitedRefresh,
    canRefresh,
    getTimeRemaining,
    clearRateLimit,
    clearAllRateLimits,
    resetRetryCount,
    isRateLimited,
    timeRemaining,
    retryCount,
    cleanup
  };
};

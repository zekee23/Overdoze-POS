// Bundle analysis utilities
export const analyzeBundleSize = () => {
  if (typeof window !== 'undefined' && window.performance) {
    const navigation = window.performance.getEntriesByType('navigation')[0];
    const resources = window.performance.getEntriesByType('resource');
    
    const jsResources = resources.filter(resource => 
      resource.name.includes('.js') && !resource.name.includes('node_modules')
    );
    
    const totalJsSize = jsResources.reduce((total, resource) => {
      return total + (resource.transferSize || 0);
    }, 0);
    
    console.log('Bundle Analysis:', {
      totalJsSize: `${(totalJsSize / 1024).toFixed(2)} KB`,
      jsFiles: jsResources.length,
      largestFile: jsResources.reduce((largest, current) => 
        (current.transferSize || 0) > (largest.transferSize || 0) ? current : largest
      , {})
    });
    
    return {
      totalJsSize,
      jsFiles: jsResources.length,
      resources: jsResources
    };
  }
  return null;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

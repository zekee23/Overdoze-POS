export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount || 0);
};

export const formatMonth = (monthString, format = 'long') => {
  if (!monthString) return '';
  return new Date(monthString + '-01').toLocaleDateString('en-US', {
    year: 'numeric',
    month: format
  });
};

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return new Date(dateString).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

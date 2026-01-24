export const validateStartingCash = (value) => {
  if (!value) return 'Please enter starting cash amount';
  if (typeof value !== 'number' || value < 0) return 'Amount must be positive';
  return null;
};

export const isMonthEnded = (month) => {
  const selectedDate = new Date(month + '-01');
  const now = new Date();
  return selectedDate.getMonth() < now.getMonth() || 
         selectedDate.getFullYear() < now.getFullYear();
};

export const canGeneratePDF = (month, dashboardData) => {
  return isMonthEnded(month) && 
         dashboardData?.starting_cash !== null && 
         dashboardData?.starting_cash !== undefined;
};

export const canSaveReport = (month, dashboardData) => {
  return isMonthEnded(month) && 
         dashboardData?.starting_cash !== null && 
         dashboardData?.starting_cash !== undefined;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export const getDaysUntilExpiry = (expiryDateStr: string): number => {
  const expiry = new Date(expiryDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getExpiryStatusTag = (expiryDateStr: string) => {
  const days = getDaysUntilExpiry(expiryDateStr);
  
  if (days < 0) {
    return {
      status: 'Expired',
      label: `Expired (${Math.abs(days)}d ago)`,
      color: 'text-red-700 bg-red-50 border-red-200',
      badgeBg: 'bg-red-500',
      isExpired: true,
      isNear: false
    };
  } else if (days <= 30) {
    return {
      status: 'Expiring in <30d',
      label: `Expiring in ${days} days`,
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      badgeBg: 'bg-rose-500',
      isExpired: false,
      isNear: true
    };
  } else if (days <= 90) {
    return {
      status: 'Expiring in <90d',
      label: `Expiring in ${days} days`,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      badgeBg: 'bg-amber-500',
      isExpired: false,
      isNear: true
    };
  } else {
    return {
      status: 'Valid',
      label: `Valid (${days} days left)`,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      badgeBg: 'bg-emerald-500',
      isExpired: false,
      isNear: false
    };
  }
};

export const getStockStatusTag = (currentStock: number, minThreshold: number) => {
  if (currentStock <= 0) {
    return {
      label: 'Out of Stock',
      color: 'text-red-700 bg-red-50 border-red-200',
      indicator: 'bg-red-500'
    };
  } else if (currentStock <= minThreshold) {
    return {
      label: 'Low Stock',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      indicator: 'bg-amber-500'
    };
  } else {
    return {
      label: 'Optimal',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      indicator: 'bg-emerald-500'
    };
  }
};

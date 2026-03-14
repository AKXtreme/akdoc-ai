import { format, parseISO } from 'date-fns';

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try { return format(parseISO(dateStr), 'MMM d, yyyy'); } catch { return dateStr; }
};

export const formatCurrency = (amount) => {
  if (amount == null) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export const statusColor = (status) => {
  const map = {
    completed: '#22c55e',
    processing: '#3b82f6',
    pending: '#f59e0b',
    failed: '#ef4444',
    review_needed: '#a855f7',
  };
  return map[status] || '#6b7280';
};

export const statusBg = (status) => {
  const map = {
    completed: '#dcfce7',
    processing: '#dbeafe',
    pending: '#fef3c7',
    failed: '#fee2e2',
    review_needed: '#f3e8ff',
  };
  return map[status] || '#f3f4f6';
};

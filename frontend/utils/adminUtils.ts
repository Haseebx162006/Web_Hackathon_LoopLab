import type { UserRole } from '@/store/apiSlice';

export const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US').format(value);
};

export const formatDate = (value?: string | Date | null) => {
  if (!value) {
    return '--';
  }

  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateTime = (value?: string | Date | null) => {
  if (!value) {
    return '--';
  }

  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const toSentenceCase = (value: string) => {
  if (!value) {
    return '--';
  }

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const normalizeApiError = (error: unknown, fallback: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof (error as { data?: unknown }).data === 'object'
  ) {
    const data = (error as { data?: { message?: unknown } }).data;
    if (data && typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const getStoredRole = (): UserRole | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const role = localStorage.getItem('role');
  if (role === 'buyer' || role === 'seller' || role === 'admin') {
    return role;
  }

  return null;
};

export const isAdminAuthenticated = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  return Boolean(token && role === 'admin');
};

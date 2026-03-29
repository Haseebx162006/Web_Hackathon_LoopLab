import type { BuyerProduct } from '@/store/buyerApi';
import { getApiOrigin } from '@/utils/apiConfig';

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

export const resolveAssetUrl = (value?: string | null) => {
  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalized = value.startsWith('/') ? value : `/${value}`;
  return `${getApiOrigin()}${normalized}`;
};

export const getProductImages = (product?: BuyerProduct | null) => {
  if (!product) {
    return [] as string[];
  }

  const fromProductImages = Array.isArray(product.productImages) ? product.productImages : [];
  const fromLegacyImages = Array.isArray(product.images) ? product.images : [];
  const merged = [...fromProductImages, ...fromLegacyImages].filter(Boolean);

  return merged.map((image) => resolveAssetUrl(image));
};

export const getPrimaryProductImage = (product?: BuyerProduct | null) => {
  const images = getProductImages(product);
  return images[0] || '/assets/logo/logo.png';
};

export const getEffectivePrice = (product?: BuyerProduct | null) => {
  if (!product) {
    return 0;
  }

  if (typeof product.discountPrice === 'number' && product.discountPrice > 0) {
    return product.discountPrice;
  }

  return product.price || 0;
};

export const getDiscountPercent = (product?: BuyerProduct | null) => {
  if (!product || !product.discountPrice || !product.price || product.discountPrice >= product.price) {
    return 0;
  }

  return Math.round(((product.price - product.discountPrice) / product.price) * 100);
};

export const getStockValue = (product?: BuyerProduct | null) => {
  if (!product) {
    return 0;
  }

  if (typeof product.stockQuantity === 'number') {
    return product.stockQuantity;
  }

  if (typeof product.stock === 'number') {
    return product.stock;
  }

  return 0;
};

export const isBuyerAuthenticated = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  return Boolean(token && role === 'buyer');
};

export const getStoredRole = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const role = localStorage.getItem('role');
  if (role === 'buyer' || role === 'seller' || role === 'admin') {
    return role;
  }

  return null;
};

export const toSentenceCase = (value: string) => {
  if (!value) {
    return '';
  }

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatDateTime = (value?: string) => {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
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

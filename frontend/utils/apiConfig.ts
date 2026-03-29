const DEFAULT_API_BASE = 'http://localhost:5000/api';
const DEFAULT_API_ORIGIN = 'http://localhost:5000';

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

export const getApiBaseUrl = () => {
  const configured = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (!configured) {
    return DEFAULT_API_BASE;
  }

  const normalized = trimTrailingSlashes(configured);
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

export const getApiOrigin = () => {
  try {
    return new URL(getApiBaseUrl()).origin;
  } catch {
    return DEFAULT_API_ORIGIN;
  }
};

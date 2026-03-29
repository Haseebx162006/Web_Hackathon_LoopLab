const normalizeOrigin = (value = '') => value.trim().replace(/\/+$/, '');

const parseOrigins = (value = '') =>
  value
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

const wildcardToRegex = (value) => {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped.replace(/\\\*/g, '.*')}$`);
};

const matchesAllowedOrigin = (requestOrigin, allowedOrigin) => {
  if (allowedOrigin === '*') {
    return true;
  }

  if (allowedOrigin.includes('*')) {
    return wildcardToRegex(allowedOrigin).test(requestOrigin);
  }

  return requestOrigin === allowedOrigin;
};

const getAllowedOrigins = () => {
  const origins = [
    ...parseOrigins(process.env.CORS_ORIGIN),
    ...parseOrigins(process.env.FRONTEND_URL),
  ];

  return [...new Set(origins)];
};

const createOriginValidator = () => {
  const allowedOrigins = getAllowedOrigins();

  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (
      allowedOrigins.length === 0 ||
      allowedOrigins.some((allowedOrigin) => matchesAllowedOrigin(normalizedOrigin, allowedOrigin))
    ) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${normalizedOrigin}`));
  };
};

const getExpressCorsOptions = () => {
  return {
    origin: createOriginValidator(),
    credentials: true,
  };
};

const getSocketCorsOptions = () => {
  return {
    origin: createOriginValidator(),
    credentials: true,
  };
};

module.exports = {
  getAllowedOrigins,
  getExpressCorsOptions,
  getSocketCorsOptions,
};

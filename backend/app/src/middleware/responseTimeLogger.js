const logger = require('../utils/logger');

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const SLOW_REQUEST_THRESHOLD_MS = toNumber(process.env.SLOW_REQUEST_THRESHOLD_MS, 300);

const shouldSkipLogging = (path = '') => {
  return path === '/health' || path === '/';
};

const responseTimeLogger = (req, res, next) => {
  if (shouldSkipLogging(req.path)) {
    return next();
  }

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    if (durationMs < SLOW_REQUEST_THRESHOLD_MS) {
      return;
    }

    logger.warn('Slow API request detected', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      contentLength: res.getHeader('content-length') || null,
    });
  });

  next();
};

module.exports = responseTimeLogger;

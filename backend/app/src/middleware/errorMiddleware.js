const { z } = require('zod');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log error in production for monitoring
  if (process.env.NODE_ENV === 'production') {
    logger.error(`${req.method} ${req.originalUrl} — ${err.message}`);
  }

  if (err instanceof z.ZodError) {
    const message = err.issues.map((i) => i.message).join(', ');
    return res.status(400).json({
      success: false,
      message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;

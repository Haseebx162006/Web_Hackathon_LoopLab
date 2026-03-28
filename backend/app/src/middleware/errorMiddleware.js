const { z } = require('zod');

const errorHandler = (err, req, res, next) => {
  if (err instanceof z.ZodError) {
    const message = err.issues.map((i) => i.message).join(', ');
    return res.status(400).json({
      message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;

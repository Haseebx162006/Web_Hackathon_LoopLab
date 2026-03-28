const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./src/routes/authRoutes');
const errorHandler = require('./src/middleware/errorMiddleware');
const limiter = require('./src/middleware/rateLimiter');

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(express.json());
app.use(cors());

// Apply rate limiter specifically to /api routes
app.use('/api/', limiter);

// Mount routing
app.use('/api/auth', authRoutes);

// Base route for testing
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Fallback logic for not found routes
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;

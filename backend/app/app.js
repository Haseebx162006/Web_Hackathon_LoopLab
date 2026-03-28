const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');

require('./src/config/passport')(passport);

const authRoutes = require('./src/routes/authRoutes');
const protectedRoutes = require('./src/routes/protectedRoutes');
const sellerRoutes = require('./src/routes/sellerRoutes');
const productRoutes = require('./src/routes/productRoutes');
const errorHandler = require('./src/middleware/errorMiddleware');
const limiter = require('./src/middleware/rateLimiter');

const app = express();

app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
);

app.use(passport.initialize());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api', protectedRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api', productRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use(errorHandler);

module.exports = app;

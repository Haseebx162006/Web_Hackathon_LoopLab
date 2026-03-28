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

// Buyer & Public Routes
const buyerRoutes = require('./src/routes/buyerRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const wishlistRoutes = require('./src/routes/wishlistRoutes');
const checkoutRoutes = require('./src/routes/checkoutRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const searchRoutes = require('./src/routes/searchRoutes');
const supportRoutes = require('./src/routes/supportRoutes');

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

// Public / Buyer mounting
app.use('/api/public', buyerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/buyer', dashboardRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/support', supportRoutes);

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

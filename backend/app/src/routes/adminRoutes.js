const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { adminLogin } = require('../controllers/adminAuthController');
const { getDashboardStats } = require('../controllers/adminDashboardController');
const { getAllUsers, getUserById, updateUserStatus } = require('../controllers/adminUserController');
const { getAllProducts, approveProduct, rejectProduct, flagProduct } = require('../controllers/adminProductController');
const { getAllOrders, getOrderById } = require('../controllers/adminOrderController');
const { getAllPayments, getSinglePayment, getRefundLogs } = require('../controllers/adminPaymentController');
const { getPlatformAnalytics } = require('../controllers/adminAnalyticsController');

const router = express.Router();

// Publicly accessible strictly for admin login
router.post('/login', adminLogin);

// Protected Admin routes
router.use(protect, isAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/status', updateUserStatus);

// Product Moderation
router.get('/products', getAllProducts);
router.patch('/products/:id/approve', approveProduct);
router.patch('/products/:id/reject', rejectProduct);
router.patch('/products/:id/flag', flagProduct);

// Order Management (read-only for admins)
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);

// Payments & Refunds
router.get('/payments', getAllPayments);
router.get('/payments/:id', getSinglePayment);
router.get('/refunds', getRefundLogs);

// Analytics
router.get('/analytics', getPlatformAnalytics);

module.exports = router;
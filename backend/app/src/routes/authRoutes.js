const express = require('express');
const { signup, login } = require('../controllers/authcontroller');
const { protect } = require('../middleware/authMiddleware');
const { isSeller, isAdmin, isBuyer } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public Routes
router.post('/signup', signup);
router.post('/login', login);

// Protected Routes Examples

// Seller only route
router.post('/products', protect, isSeller, (req, res) => {
    res.status(200).json({ success: true, message: 'Product created successfully by seller.' });
});

// Admin only route
router.get('/admin/users', protect, isAdmin, (req, res) => {
    res.status(200).json({ success: true, message: 'Admin access: fetching all users.' });
});

// Buyer only route
router.get('/buyer/orders', protect, isBuyer, (req, res) => {
    res.status(200).json({ success: true, message: 'Buyer access: fetching your orders.' });
});

module.exports = router;

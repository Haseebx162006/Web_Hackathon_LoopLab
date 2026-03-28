const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { isSeller, isAdmin, isBuyer } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/seller/products', protect, isSeller, (req, res) => {
  res.status(200).json({ success: true, message: 'Product created successfully by seller.' });
});

router.get('/admin/users', protect, isAdmin, (req, res) => {
  res.status(200).json({ success: true, message: 'Admin access: fetching all users.' });
});

router.get('/buyer/orders', protect, isBuyer, (req, res) => {
  res.status(200).json({ success: true, message: 'Buyer access: fetching your orders.' });
});

module.exports = router;

const express = require('express');
const { checkoutCart, mockPaymentWebhook } = require('../controllers/checkoutController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/checkout', protect, checkoutCart);
router.post('/payment-webhook', mockPaymentWebhook); // Can be hit by payment gateway

module.exports = router;
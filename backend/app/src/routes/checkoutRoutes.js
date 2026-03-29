const express = require('express');
const { checkoutCart, mockPaymentWebhook, verifyPayment, uploadPaymentProof, createPaymentIntent } = require('../controllers/checkoutController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/checkout', protect, checkoutCart);
router.patch('/:orderId/verify-payment', protect, verifyPayment);
router.post('/upload-proof', protect, upload.single('image'), uploadPaymentProof);
router.post('/payment-webhook', mockPaymentWebhook); // Can be hit by payment gateway

module.exports = router;
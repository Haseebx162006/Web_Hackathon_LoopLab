const express = require('express');
const { getBuyerOrders, requestOrderReturn } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { isBuyer } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, isBuyer);

router.get('/orders', getBuyerOrders);
router.post('/orders/:id/return', requestOrderReturn);

module.exports = router;
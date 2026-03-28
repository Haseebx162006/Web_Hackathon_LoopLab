const express = require('express');
const { getBuyerOrders, requestOrderReturn } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/orders', getBuyerOrders);
router.post('/orders/:id/return', requestOrderReturn);

module.exports = router;
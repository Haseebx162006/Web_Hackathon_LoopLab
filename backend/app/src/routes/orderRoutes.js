const express = require('express');
const {
  listOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController');

const router = express.Router();

router.get('/orders', listOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/orders/:id', getOrderById);

module.exports = router;

const express = require('express');
const {
  getBuyerOrders,
  requestOrderReturn,
  confirmOrderReceived,
  getBuyerProfile,
  updateBuyerProfile,
  addAddress,
  removeAddress,
  setDefaultAddress,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { isBuyer } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, isBuyer);

router.get('/orders', getBuyerOrders);
router.post('/orders/:id/return', requestOrderReturn);
router.patch('/orders/:id/confirm-received', confirmOrderReceived);

// Profile routes
router.get('/profile', getBuyerProfile);
router.patch('/profile', updateBuyerProfile);

// Address routes
router.post('/addresses', addAddress);
router.delete('/addresses/:id', removeAddress);
router.patch('/addresses/:id/default', setDefaultAddress);


module.exports = router;
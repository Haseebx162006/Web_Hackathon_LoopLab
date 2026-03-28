const express = require('express');
const {
  createCoupon,
  listCoupons,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/couponController');

const router = express.Router();

router.post('/coupons', createCoupon);
router.get('/coupons', listCoupons);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

module.exports = router;

const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { isSeller } = require('../middleware/roleMiddleware');
const { suggestDynamicPrice } = require('../controllers/pricingController');

const router = express.Router();

router.post('/suggest', protect, isSeller, suggestDynamicPrice);

module.exports = router;

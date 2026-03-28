const express = require('express');
const { getDashboard } = require('../controllers/sellerController');
const { protect } = require('../middleware/authMiddleware');
const { isSeller } = require('../middleware/roleMiddleware');

const router = express.Router();

// All seller routes require auth and seller role
router.use(protect, isSeller);

router.get('/dashboard', getDashboard);

module.exports = router;

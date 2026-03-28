const express = require('express');
const { getDashboard } = require('../controllers/sellerController');
const { protect } = require('../middleware/authMiddleware');
const { isSeller } = require('../middleware/roleMiddleware');
const orderRoutes = require('./orderRoutes');
const couponRoutes = require('./couponRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const profileRoutes = require('./profileRoutes');
const productRoutes = require('./productRoutes');
const inventoryRoutes = require('./inventoryRoutes');

const router = express.Router();

router.use(protect, isSeller);

router.get('/dashboard', getDashboard);
router.use('/', orderRoutes);
router.use('/', couponRoutes);
router.use('/', analyticsRoutes);
router.use('/', profileRoutes);
router.use('/', productRoutes);
router.use('/', inventoryRoutes);

module.exports = router;

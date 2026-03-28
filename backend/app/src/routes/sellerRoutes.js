const express = require('express');
const { getDashboard } = require('../controllers/sellerController');
const { protect } = require('../middleware/authMiddleware');
const { isSeller } = require('../middleware/roleMiddleware');
const productRoutes = require('./productRoutes');
const inventoryRoutes = require('./inventoryRoutes');

const router = express.Router();

router.use(protect, isSeller);

router.get('/dashboard', getDashboard);
router.use('/', productRoutes);
router.use('/', inventoryRoutes);

module.exports = router;

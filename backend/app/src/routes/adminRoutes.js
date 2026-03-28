const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { adminLogin } = require('../controllers/adminAuthController');
const { getDashboardStats } = require('../controllers/adminDashboardController');

const router = express.Router();

router.post('/login', adminLogin);
router.get('/dashboard', protect, isAdmin, getDashboardStats);

module.exports = router;
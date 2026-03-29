const express = require('express');
const { addReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { isBuyer } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/:productId', protect, isBuyer, addReview);

module.exports = router;
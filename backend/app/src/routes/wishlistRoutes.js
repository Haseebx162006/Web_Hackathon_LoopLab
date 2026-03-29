const express = require('express');
const { getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');
const { isBuyer } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, isBuyer);

router.get('/', getWishlist);
router.post('/add', addToWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;
const express = require('express');
const { getCart, addToCart, removeFromCart, updateCartQuantity } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const { isBuyer } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, isBuyer);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartQuantity);
router.delete('/:productId', removeFromCart);

module.exports = router;
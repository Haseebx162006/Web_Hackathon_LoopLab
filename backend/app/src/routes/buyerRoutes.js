const express = require('express');
const {
  getHomeData,
  searchProducts,
  getProductDetails,
} = require('../controllers/buyerController');

const router = express.Router();

router.get('/home', getHomeData);
router.get('/products', searchProducts);
router.get('/products/:id', getProductDetails);

module.exports = router;
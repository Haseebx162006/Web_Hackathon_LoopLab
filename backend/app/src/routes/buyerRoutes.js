const express = require('express');
const {
  getHomeData,
  searchProducts,
  getProductDetails,
  getPublicStores,
} = require('../controllers/buyerController');

const router = express.Router();

router.get('/home', getHomeData);
router.get('/products', searchProducts);
router.get('/products/:id', getProductDetails);
router.get('/stores', getPublicStores);

module.exports = router;
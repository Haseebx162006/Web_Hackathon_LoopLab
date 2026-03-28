const express = require('express');
const {
  getInventory,
  updateStock,
  bulkUpdateStock,
} = require('../controllers/inventoryController');

const router = express.Router();

router.get('/inventory', getInventory);
router.put('/inventory/:id', updateStock);
router.put('/inventory/bulk', bulkUpdateStock);

module.exports = router;

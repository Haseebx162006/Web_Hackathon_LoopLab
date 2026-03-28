// Re-exports used by seller/product/inventory routes (single import surface)
const { protect } = require('./authMiddleware');
const { isSeller: requireSeller } = require('./roleMiddleware');

const sellerOnly = [protect, requireSeller];

module.exports = {
  protect,
  requireSeller,
  sellerOnly,
};

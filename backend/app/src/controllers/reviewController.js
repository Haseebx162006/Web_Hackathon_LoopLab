const mongoose = require('mongoose');
const Review = require('../models/Review');
const Order = require('../models/Order');

const addReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400);
      return next(new Error('Invalid product id'));
    }

    // Verify buyer purchased it
    const order = await Order.findOne({
      buyerId: req.user._id,
      'items.product': productId,
      status: 'delivered',
    });

    if (!order) {
      res.status(403);
      return next(new Error('You can only review products you have purchased and received'));
    }

    const existingReview = await Review.findOne({ product: productId, buyerId: req.user._id });
    if (existingReview) {
      res.status(400);
      return next(new Error('You have already reviewed this product'));
    }

    const review = await Review.create({
      product: productId,
      buyerId: req.user._id,
      rating,
      comment,
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addReview,
};
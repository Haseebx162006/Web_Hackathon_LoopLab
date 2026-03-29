const mongoose = require('mongoose');
const Review = require('../models/Review');
const Order = require('../models/Order');
const { z } = require('zod');

const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(2000, 'Comment too long').trim().optional(),
});

const addReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = reviewSchema.parse(req.body);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400);
      return next(new Error('Invalid product id'));
    }

    // Verify buyer purchased it
    const hasDeliveredOrder = await Order.exists({
      buyerId: req.user._id,
      'items.product': productId,
      status: 'delivered',
    });

    if (!hasDeliveredOrder) {
      res.status(403);
      return next(new Error('You can only review products you have purchased and received'));
    }

    const alreadyReviewed = await Review.exists({ product: productId, buyerId: req.user._id });
    if (alreadyReviewed) {
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
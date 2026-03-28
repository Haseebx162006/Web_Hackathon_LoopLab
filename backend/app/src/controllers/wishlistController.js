const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ buyerId: req.user._id }).populate({
      path: 'items',
      select: 'productName price discountPrice productImages status stockQuantity'
    });

    if (!wishlist) {
      wishlist = { items: [] };
    }

    res.status(200).json({ success: true, data: wishlist });
  } catch (err) {
    next(err);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400);
      return next(new Error('Invalid product id'));
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    if (product.status !== 'approved') {
      res.status(400);
      return next(new Error('Only approved products can be added to wishlist'));
    }

    let wishlist = await Wishlist.findOne({ buyerId: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ buyerId: req.user._id, items: [] });
    }

    const exists = wishlist.items.some((id) => id.toString() === productId);
    if (!exists) {
      wishlist.items.push(productId);
      await wishlist.save();
    }

    res.status(200).json({ success: true, data: wishlist });
  } catch (err) {
    next(err);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ buyerId: req.user._id });
    if (!wishlist) {
      res.status(404);
      return next(new Error('Wishlist not found'));
    }

    wishlist.items = wishlist.items.filter(id => id.toString() !== productId);
    await wishlist.save();

    res.status(200).json({ success: true, data: wishlist });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
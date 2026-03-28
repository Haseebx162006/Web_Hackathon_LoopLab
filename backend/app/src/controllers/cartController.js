const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ buyerId: req.user._id }).populate({
      path: 'items.product',
      select: 'productName price discountPrice images stock'
    });

    if (!cart) {
      cart = { items: [] };
    }

    // Subtotal calculation
    let subtotal = 0;
    cart.items.forEach(item => {
      const price = item.product.discountPrice || item.product.price;
      subtotal += price * item.quantity;
    });

    res.status(200).json({ success: true, data: { cart, subtotal } });
  } catch (err) {
    next(err);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400);
      return next(new Error('Invalid product id'));
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    let cart = await Cart.findOne({ buyerId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ buyerId: req.user._id, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    res.status(200).json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
};

const updateCartQuantity = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400);
      return next(new Error('Invalid product id'));
    }

    const cart = await Cart.findOne({ buyerId: req.user._id });
    if (!cart) {
      res.status(404);
      return next(new Error('Cart not found'));
    }

    const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (existingItemIndex > -1) {
      if (quantity <= 0) {
        cart.items.splice(existingItemIndex, 1);
      } else {
        cart.items[existingItemIndex].quantity = quantity;
      }
      await cart.save();
      res.status(200).json({ success: true, data: cart });
    } else {
      res.status(404);
      next(new Error('Item not found in cart'));
    }
  } catch (err) {
    next(err);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ buyerId: req.user._id });
    if (!cart) {
      res.status(404);
      return next(new Error('Cart not found'));
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();
    res.status(200).json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
};
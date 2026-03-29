const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ buyerId: req.user._id }).populate({
      path: 'items.product',
      select: 'productName price discountPrice productImages stockQuantity status'
    }).lean();

    if (!cart) {
      cart = { items: [] };
    }

    // Subtotal calculation
    const subtotal = (cart.items || []).reduce((sum, item) => {
      if (!item.product) {
        return sum;
      }
      const price = item.product.discountPrice != null ? item.product.discountPrice : item.product.price;
      return sum + (price * item.quantity);
    }, 0);

    res.status(200).json({ success: true, data: { cart, subtotal } });
  } catch (err) {
    next(err);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const quantityNumber = Number(quantity);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400);
      return next(new Error('Invalid product id'));
    }

    if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
      res.status(400);
      return next(new Error('Quantity must be a positive number'));
    }

    const product = await Product.findById(productId)
      .select('status stockQuantity')
      .lean();
    if (!product) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    if (product.status !== 'approved') {
      res.status(400);
      return next(new Error('Only approved products can be added to cart'));
    }

    if (product.stockQuantity != null && product.stockQuantity < quantityNumber) {
      res.status(400);
      return next(new Error('Requested quantity exceeds available stock'));
    }

    let cart = await Cart.findOne({ buyerId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ buyerId: req.user._id, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (existingItemIndex > -1) {
      const nextQuantity = cart.items[existingItemIndex].quantity + quantityNumber;
      if (product.stockQuantity != null && nextQuantity > product.stockQuantity) {
        res.status(400);
        return next(new Error('Requested quantity exceeds available stock'));
      }
      cart.items[existingItemIndex].quantity = nextQuantity;
    } else {
      cart.items.push({ product: productId, quantity: quantityNumber });
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
    const quantityNumber = Number(quantity);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400);
      return next(new Error('Invalid product id'));
    }

    const cart = await Cart.findOne({ buyerId: req.user._id });
    if (!cart) {
      res.status(404);
      return next(new Error('Cart not found'));
    }

    if (!Number.isFinite(quantityNumber)) {
      res.status(400);
      return next(new Error('Quantity must be a valid number'));
    }

    const product = await Product.findById(productId)
      .select('stockQuantity status')
      .lean();
    if (!product) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    if (product.status !== 'approved') {
      res.status(400);
      return next(new Error('Product is not available for purchase'));
    }

    const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (existingItemIndex > -1) {
      if (quantityNumber <= 0) {
        cart.items.splice(existingItemIndex, 1);
      } else {
        if (product.stockQuantity != null && quantityNumber > product.stockQuantity) {
          res.status(400);
          return next(new Error('Requested quantity exceeds available stock'));
        }
        cart.items[existingItemIndex].quantity = quantityNumber;
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
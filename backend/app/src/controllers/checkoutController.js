const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const { checkoutSchema } = require('../utils/validators');

const checkoutCart = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { shippingAddress, paymentMethod } = checkoutSchema.parse(req.body);

    const cart = await Cart.findOne({ buyerId: req.user._id })
      .populate({
        path: 'items.product',
        select: 'sellerId price discountPrice stockQuantity productName status',
      })
      .session(session);
    if (!cart || cart.items.length === 0) {
      res.status(400);
      return next(new Error('Cart is empty'));
    }

    // Group items by sellerId
    const ordersBySeller = {};

    for (const item of cart.items) {
      const product = item.product;

      if (!product || product.status !== 'approved') {
        res.status(400);
        throw new Error('One or more products in cart are no longer available');
      }

      const sellerIdStr = product.sellerId.toString();

      if (!ordersBySeller[sellerIdStr]) {
        ordersBySeller[sellerIdStr] = {
          items: [],
          totalAmount: 0,
        };
      }

      const price = product.discountPrice != null ? product.discountPrice : product.price;

      ordersBySeller[sellerIdStr].items.push({
        product: product._id,
        quantity: item.quantity,
        priceAtPurchase: price,
      });

      ordersBySeller[sellerIdStr].totalAmount += price * item.quantity;
      
      // Atomic stock reduction — prevents race conditions with concurrent checkouts
      if (product.stockQuantity != null) {
        const updated = await Product.findOneAndUpdate(
          { _id: product._id, stockQuantity: { $gte: item.quantity } },
          { $inc: { stockQuantity: -item.quantity } },
          { new: true, session }
        );
        if (!updated) {
          throw new Error(`Insufficient stock for product ${product.productName}`);
        }
      }
    }

    const createdOrders = [];
    for (const [sellerId, orderData] of Object.entries(ordersBySeller)) {
      const newOrder = await Order.create([{
        buyerId: req.user._id,
        sellerId,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        status: paymentMethod === 'cod' ? 'pending' : 'pending', // Will update via webhook for non-COD
        shippingAddress,
      }], { session });

      createdOrders.push(newOrder[0]);
    }

    // Clear cart
    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    logger.info(`User ${req.user._id} checked out ${createdOrders.length} orders`);

    res.status(201).json({
      success: true,
      data: {
        message: 'Order(s) placed successfully',
        orders: createdOrders.map(o => o._id),
      }
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

const mockPaymentWebhook = async (req, res, next) => {
  try {
    // Verify webhook secret to prevent unauthorized access
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const providedSecret = req.headers['x-webhook-secret'];
    
    if (webhookSecret && providedSecret !== webhookSecret) {
      res.status(401);
      return next(new Error('Invalid webhook secret'));
    }

    const { orderIds, paymentStatus } = req.body;
    
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      res.status(400);
      return next(new Error('orderIds must be a non-empty array'));
    }

    if (!['success', 'failed'].includes(paymentStatus)) {
      res.status(400);
      return next(new Error('paymentStatus must be "success" or "failed"'));
    }

    if (paymentStatus === 'success') {
      await Order.updateMany(
        { _id: { $in: orderIds } },
        { status: 'confirmed' }
      );
    }
    
    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkoutCart,
  mockPaymentWebhook,
};
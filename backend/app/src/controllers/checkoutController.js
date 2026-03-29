const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const { checkoutSchema } = require('../utils/validators');
const { uploadImage } = require('../utils/cloudinary');

const checkoutCart = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { shippingAddress, paymentMethod, paymentProof } = checkoutSchema.parse(req.body);

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
      // Determine order status based on payment method
      let status = 'pending';
      let paymentStatus = 'unpaid';

      if (paymentMethod === 'boutique_account') {
        status = 'payment_pending';
        paymentStatus = 'pending_verification';
      } else if (paymentMethod === 'card' || paymentMethod === 'wallet') {
        // These will be updated via webhook/wallet logic
        status = 'payment_pending';
        paymentStatus = 'unpaid';
      }

      const newOrder = await Order.create([{
        buyerId: req.user._id,
        sellerId,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        status,
        paymentMethod,
        paymentStatus,
        paymentProof: paymentMethod === 'boutique_account' ? (typeof paymentProof === 'object' && paymentProof !== null && !Array.isArray(paymentProof) ? paymentProof[sellerId] : paymentProof) : null,
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

const uploadPaymentProof = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      return next(new Error('No image provided'));
    }

    const imageUrl = await uploadImage(req.file.buffer);

    res.status(200).json({
      success: true,
      data: imageUrl,
      message: 'Payment proof uploaded successfully',
    });
  } catch (err) {
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

const verifyPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      res.status(400);
      return next(new Error('Invalid action. Use "approve" or "reject".'));
    }

    const order = await Order.findOne({ _id: orderId, sellerId: req.user._id });
    if (!order) {
      res.status(404);
      return next(new Error('Order not found or not owned by you.'));
    }

    if (order.paymentStatus !== 'pending_verification') {
      res.status(400);
      return next(new Error(`Manual verification not applicable for current status: ${order.paymentStatus}`));
    }

    if (action === 'approve') {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
    } else {
      order.paymentStatus = 'failed';
    }

    await order.save();

    res.status(200).json({
      success: true,
      data: order,
      message: `Payment ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkoutCart,
  mockPaymentWebhook,
  verifyPayment,
  uploadPaymentProof,
};

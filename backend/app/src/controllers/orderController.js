const mongoose = require('mongoose');
const Order = require('../models/Order');
const { sellerOrderStatusSchema } = require('../utils/validators');
const { sendOrderStatusEmail } = require('../services/email/email.service');
const logger = require('../utils/logger');

const sellerId = (req) => req.user._id;

const populateOptions = [
  { path: 'buyerId', select: 'name email phoneNumber' },
  {
    path: 'items.product',
    select: 'productName skuCode productImages price discountPrice',
  },
];

const listOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { sellerId: sellerId(req) };
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate(populateOptions)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    const data = orders.map((o) => {
      const { buyerId, ...rest } = o;
      return {
        ...rest,
        buyer: buyerId,
        total: o.totalAmount,
      };
    });

    res.status(200).json({
      success: true,
      data,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid order id'));
    }

    const order = await Order.findOne({ _id: id, sellerId: sellerId(req) })
      .populate(populateOptions)
      .lean();

    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    const { buyerId, ...rest } = order;
    res.status(200).json({
      success: true,
      data: {
        ...rest,
        buyer: buyerId,
        total: order.totalAmount,
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid order id'));
    }

    const body = sellerOrderStatusSchema.parse(req.body);
    const update = { status: body.status };
    if (body.trackingId !== undefined) {
      update.trackingId = body.trackingId ? body.trackingId.trim() : null;
    }

    const order = await Order.findOneAndUpdate(
      { _id: id, sellerId: sellerId(req) },
      { $set: update },
      { new: true, runValidators: true }
    )
      .populate(populateOptions)
      .lean();

    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    setImmediate(() => {
      sendOrderStatusEmail({
        ...order,
        orderId: order._id,
        buyer: order.buyerId,
        seller: {
          _id: order.sellerId,
          storeName: req.user.storeName,
          email: req.user.email,
        },
      }).catch((error) => {
        logger.error('Failed to queue buyer order status email', {
          orderId: String(order._id),
          status: order.status,
          error: error.message,
        });
      });
    });

    const { buyerId, ...rest } = order;
    res.status(200).json({
      success: true,
      data: {
        ...rest,
        buyer: buyerId,
        total: order.totalAmount,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listOrders,
  getOrderById,
  updateOrderStatus,
};

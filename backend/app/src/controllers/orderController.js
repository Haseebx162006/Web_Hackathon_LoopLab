const mongoose = require('mongoose');
const Order = require('../models/Order');
const { sellerOrderStatusSchema } = require('../utils/validators');

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
    const orders = await Order.find({ sellerId: sellerId(req) })
      .populate(populateOptions)
      .sort({ createdAt: -1 })
      .lean();

    const data = orders.map((o) => {
      const { buyerId, ...rest } = o;
      return {
        ...rest,
        buyer: buyerId,
        total: o.totalAmount,
      };
    });

    res.status(200).json({ success: true, data: data });
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

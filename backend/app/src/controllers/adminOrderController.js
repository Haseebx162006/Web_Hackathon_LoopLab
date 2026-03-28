const { z } = require('zod');
const Order = require('../models/Order');
const {
  adminUpdateOrderStatusSchema,
  adminUpdateOrderReturnSchema,
  adminUpdateOrderRefundSchema,
} = require('../utils/validators');

const getAllOrders = async (req, res, next) => {
  try {
    const { status, returnStatus, refundStatus, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (returnStatus) query.returnStatus = returnStatus;
    if (refundStatus) query.refundStatus = refundStatus;

    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find(query)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'storeName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('buyerId', 'name email phone')
      .populate('sellerId', 'storeName email phone businessAddress')
      .populate('items.product', 'productName skuCode productImages');

    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = adminUpdateOrderStatusSchema.parse(req.body);

    const order = await Order.findById(id);
    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    order.status = validatedData.status;
    await order.save();

    console.log(`[AUDIT] Admin ${req.user.email} updated order ${order._id} status to ${order.status}`);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: err.errors[0].message });
    }
    next(err);
  }
};

const updateOrderReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = adminUpdateOrderReturnSchema.parse({ returnStatus: req.body.returnStatus });

    const order = await Order.findById(id);
    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    order.returnStatus = validatedData.returnStatus;
    if (validatedData.returnStatus === 'approved') {
       order.status = 'returned'; // implicitly sync status if return is approved
    }
    await order.save();

    console.log(`[AUDIT] Admin ${req.user.email} updated order ${order._id} returnStatus to ${order.returnStatus}`);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: err.errors[0].message });
    }
    next(err);
  }
};

const updateOrderRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = adminUpdateOrderRefundSchema.parse({ refundStatus: req.body.refundStatus });

    const order = await Order.findById(id);
    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    order.refundStatus = validatedData.refundStatus;
    await order.save();

    console.log(`[AUDIT] Admin ${req.user.email} updated order ${order._id} refundStatus to ${order.refundStatus}`);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: err.errors[0].message });
    }
    next(err);
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderReturn,
  updateOrderRefund,
};
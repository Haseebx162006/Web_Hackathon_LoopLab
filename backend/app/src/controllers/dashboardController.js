const mongoose = require('mongoose');
const Order = require('../models/Order');

const getBuyerOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { buyerId: req.user._id };
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('sellerId', 'storeName')
        .populate('items.product', 'productName productImages price discountPrice category stockQuantity')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

const requestOrderReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid order id'));
    }

    const order = await Order.findOne({ _id: id, buyerId: req.user._id });
    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    if (order.status !== 'delivered') {
      res.status(400);
      return next(new Error('Only delivered orders can be returned'));
    }

    order.status = 'return_requested';
    await order.save();

    res.status(200).json({ success: true, message: 'Return requested successfully', data: order });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBuyerOrders,
  requestOrderReturn,
};

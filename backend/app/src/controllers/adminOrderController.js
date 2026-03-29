const Order = require('../models/Order');

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

module.exports = {
  getAllOrders,
  getOrderById,
};
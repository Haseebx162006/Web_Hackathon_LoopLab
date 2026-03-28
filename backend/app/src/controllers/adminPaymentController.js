const Payment = require('../models/Payment');
const { z } = require('zod');
const { adminPaymentsQuerySchema } = require('../utils/validators');

const getAllPayments = async (req, res, next) => {
  try {
    const queryData = adminPaymentsQuerySchema.parse(req.query);
    const { page, limit, status, startDate, endDate } = queryData;

    const query = {};
    if (status) {
      query.status = status;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const payments = await Payment.find(query)
      .populate('userId', 'name email role')
      .populate('orderId', 'totalAmount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: err.errors[0].message });
    }
    next(err);
  }
};

const getSinglePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id)
      .populate('userId', 'name email role phone')
      .populate('orderId', 'totalAmount status items trackingId returnStatus refundStatus');

    if (!payment) {
      res.status(404);
      return next(new Error('Payment not found'));
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (err) {
    next(err);
  }
};

const getRefundLogs = async (req, res, next) => {
  try {
    // We fetch payments where refundStatus is NOT 'none'
    const query = { refundStatus: { $ne: 'none' } };

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const refunds = await Payment.find(query)
      .populate('userId', 'name email')
      .populate('orderId', 'totalAmount status returnStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        refunds,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllPayments,
  getSinglePayment,
  getRefundLogs,
};
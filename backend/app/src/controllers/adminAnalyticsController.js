const Order = require('../models/Order');
const { z } = require('zod');
const { adminAnalyticsQuerySchema } = require('../utils/validators');

const REVENUE_RECOGNIZED_STATUSES = ['processing', 'confirmed', 'packed', 'shipped', 'delivered'];

const getPlatformAnalytics = async (req, res, next) => {
  try {
    const { period } = adminAnalyticsQuerySchema.parse(req.query);

    let periodFormat = '%Y-%m-%d'; // daily
    if (period === 'monthly') periodFormat = '%Y-%m';
    else if (period === 'weekly') periodFormat = '%Y-%U'; // week of year

    const [revenueChart, orderTrends, topCategories] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            status: { $in: REVENUE_RECOGNIZED_STATUSES },
            refundStatus: { $ne: 'completed' },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: periodFormat, date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: periodFormat, date: '$createdAt' } },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDetails',
          },
        },
        { $unwind: '$productDetails' },
        {
          $group: {
            _id: '$productDetails.category',
            totalSales: { $sum: '$items.quantity' },
          },
        },
        { $sort: { totalSales: -1 } },
      ]),
    ]);

    // 4. Active Users — using aggregation to count distinct users (efficient)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [activeBuyerAgg, activeSellerAgg] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$buyerId' } },
        { $count: 'total' },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$sellerId' } },
        { $count: 'total' },
      ]),
    ]);

    const activeBuyerCount = activeBuyerAgg[0]?.total || 0;
    const activeSellerCount = activeSellerAgg[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        revenueChart: revenueChart.map((item) => ({ date: item._id, revenue: item.revenue })),
        orderTrends: orderTrends.map((item) => ({ date: item._id, orders: item.orders })),
        topCategories: topCategories.map((item) => ({ category: item._id, totalSales: item.totalSales })),
        activeUsers: {
          buyers: activeBuyerCount,
          sellers: activeSellerCount,
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

module.exports = {
  getPlatformAnalytics,
};
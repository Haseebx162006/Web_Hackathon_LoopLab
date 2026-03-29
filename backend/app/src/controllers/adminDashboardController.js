const User = require('../models/User');
const Order = require('../models/Order');

const REVENUE_RECOGNIZED_STATUSES = ['processing', 'confirmed', 'packed', 'shipped', 'delivered'];

const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalBuyers,
      totalSellers,
      orderStats,
      revenueStats,
      recentOrders,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: 'seller' }),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            pendingOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
              },
            },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            status: { $in: REVENUE_RECOGNIZED_STATUSES },
            refundStatus: { $ne: 'completed' },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
          },
        },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('buyerId', 'name email')
        .populate('sellerId', 'storeName email')
        .lean(),
      User.find().sort({ createdAt: -1 }).limit(10).select('-password').lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalBuyers,
        totalSellers,
        totalOrders: orderStats.length > 0 ? orderStats[0].totalOrders : 0,
        pendingOrders: orderStats.length > 0 ? orderStats[0].pendingOrders : 0,
        totalRevenue: revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0,
        recentOrders,
        recentUsers,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
};
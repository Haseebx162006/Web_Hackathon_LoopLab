const User = require('../models/User');
const Order = require('../models/Order');

const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const totalSellers = await User.countDocuments({ role: 'seller' });
    
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);
    
    // Revenue specific to completed/paid orders etc. could be aggregated here if needed.
    const revenueStats = await Order.aggregate([
        { $match: { status: { $in: ['delivered'] } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' }
          }
        }
    ]);
    
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10).populate('buyerId', 'name email').populate('sellerId', 'name email');
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(10).select('-password');

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalBuyers,
        totalSellers,
        totalOrders: orderStats.length > 0 ? orderStats[0].totalOrders : 0,
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
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

const getDashboard = async (req, res, next) => {
  try {
    const sid = new mongoose.Types.ObjectId(req.user._id);

    const summaryRows = await Order.aggregate([
      { $match: { sellerId: sid } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
            },
          },
          totalSales: {
            $sum: {
              $cond: [{ $eq: ['$status', 'delivered'] }, '$totalAmount', 0],
            },
          },
        },
      },
    ]);

    const summary = summaryRows[0] || {
      totalOrders: 0,
      pendingOrders: 0,
      totalSales: 0,
    };

    // 3. Find Low Stock Alerts (Stock < 10 threshold)
    const lowStockThreshold = Number(process.env.LOW_STOCK_THRESHOLD) || 10;
    const lowStock = await Product.find({
      sellerId: req.user._id,
      stockQuantity: { $lt: lowStockThreshold },
    })
      .select('productName stockQuantity price')
      .sort({ stockQuantity: 1 })
      .limit(20)
      .lean();

    // 4. Calculate Sales Graph Data (Recent 7 Days for Example)
    // Aggregating sales amount day by day for front-end charts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const salesGraphData = await Order.aggregate([
      {
        $match: {
          sellerId: sid,
          status: 'delivered', // Only counting completed sales
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } } // chronologically
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSales: summary.totalSales || 0,
        totalOrders: summary.totalOrders || 0,
        pendingOrders: summary.pendingOrders || 0,
        lowStock,
        salesGraphData
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard
};

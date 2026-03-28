const Order = require('../models/Order');
const Product = require('../models/Product');

const getDashboard = async (req, res, next) => {
  try {
    const sellerId = req.user._id;

    // 1. Calculate Total Sales Summary & Total Orders
    const orders = await Order.find({ sellerId });
    
    const totalOrders = orders.length;
    
    // Sum only completed/delivered order amounts
    const totalSales = orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // 2. Count Pending Orders
    const pendingOrders = orders.filter(order => order.status === 'pending').length;

    // 3. Find Low Stock Alerts (Stock < 10 threshold)
    const lowStockThreshold = Number(process.env.LOW_STOCK_THRESHOLD) || 10;
    const lowStock = await Product.find({
      sellerId,
      stockQuantity: { $lt: lowStockThreshold },
    }).select('productName stockQuantity price');

    // 4. Calculate Sales Graph Data (Recent 7 Days for Example)
    // Aggregating sales amount day by day for front-end charts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const salesGraphData = await Order.aggregate([
      {
        $match: {
          sellerId,
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
        totalSales,
        totalOrders,
        pendingOrders,
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

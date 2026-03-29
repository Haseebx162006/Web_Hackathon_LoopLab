const mongoose = require('mongoose');
const Order = require('../models/Order');
const { analyticsQuerySchema } = require('../utils/validators');

const sellerId = (req) => req.user._id;

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const buildSalesGraphPipeline = (groupBy, matchBase) => {
  if (groupBy === 'day') {
    return [
      { $match: matchBase },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          period: '$_id',
          revenue: 1,
          ordersCount: 1,
        },
      },
    ];
  }

  if (groupBy === 'month') {
    return [
      { $match: matchBase },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          period: '$_id',
          revenue: 1,
          ordersCount: 1,
        },
      },
    ];
  }

  return [
    { $match: matchBase },
    {
      $group: {
        _id: {
          year: { $isoWeekYear: '$createdAt' },
          week: { $isoWeek: '$createdAt' },
        },
        revenue: { $sum: '$totalAmount' },
        ordersCount: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } },
    {
      $project: {
        _id: 0,
        period: {
          $concat: [
            { $toString: '$_id.year' },
            '-W',
            { $toString: '$_id.week' },
          ],
        },
        revenue: 1,
        ordersCount: 1,
      },
    },
  ];
};

const getAnalytics = async (req, res, next) => {
  try {
    const parsed = analyticsQuerySchema.parse({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      groupBy: req.query.groupBy,
    });

    const start = new Date(parsed.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(parsed.endDate);
    end.setHours(23, 59, 59, 999);

    const sid = toObjectId(sellerId(req));
    const matchBase = {
      sellerId: sid,
      createdAt: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' },
    };

    const groupBy = parsed.groupBy;

    const [revenueAgg, ordersCount, topProducts, salesGraphData] = await Promise.all([
      Order.aggregate([
        { $match: matchBase },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments(matchBase),
      Order.aggregate([
        { $match: matchBase },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            unitsSold: { $sum: '$items.quantity' },
            revenue: {
              $sum: {
                $multiply: ['$items.quantity', '$items.priceAtPurchase'],
              },
            },
          },
        },
        { $sort: { unitsSold: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            productId: '$_id',
            productName: '$product.productName',
            skuCode: '$product.skuCode',
            unitsSold: 1,
            revenue: 1,
          },
        },
      ]),
      Order.aggregate(buildSalesGraphPipeline(groupBy, matchBase)),
    ]);

    const revenue = revenueAgg[0]?.revenue ?? 0;

    res.status(200).json({
      success: true,
      data: {
        revenue,
        ordersCount,
        topProducts,
        salesGraphData,
        groupBy,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnalytics,
};

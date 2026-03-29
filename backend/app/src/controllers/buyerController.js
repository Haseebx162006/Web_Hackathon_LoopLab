const mongoose = require('mongoose');
const Product = require('../models/Product');
const Review = require('../models/Review');

const getPublicStatuses = async () => {
  const approvedExists = await Product.exists({ status: 'approved' });
  if (approvedExists) {
    return ['approved'];
  }

  return ['approved', 'pending'];
};

const attachRatings = async (products) => {
  if (!products || products.length === 0) {
    return [];
  }

  const productIds = products
    .map((product) => product?._id)
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (productIds.length === 0) {
    return products;
  }

  const ratingRows = await Review.aggregate([
    { $match: { product: { $in: productIds } } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const ratingMap = new Map(
    ratingRows.map((row) => [
      String(row._id),
      {
        rating: Number((row.avgRating || 0).toFixed(1)),
        totalReviews: row.totalReviews || 0,
      },
    ])
  );

  return products.map((product) => {
    const key = String(product._id);
    const ratingInfo = ratingMap.get(key) || { rating: 0, totalReviews: 0 };
    return {
      ...product,
      rating: ratingInfo.rating,
      totalReviews: ratingInfo.totalReviews,
    };
  });
};

const getHomeData = async (req, res, next) => {
  try {
    const statuses = await getPublicStatuses();

    const featuredProducts = await Product.find({ status: { $in: statuses } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('productName price discountPrice productImages category skuCode stockQuantity')
      .lean();

    const featuredWithRatings = await attachRatings(featuredProducts);

    const categories = await Product.distinct('category', { status: { $in: statuses } });

    res.status(200).json({
      success: true,
      data: {
        featuredProducts: featuredWithRatings,
        categories,
        banners: []
      }
    });
  } catch (err) {
    next(err);
  }
};

const searchProducts = async (req, res, next) => {
  try {
    const { search, category, sellerId, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;
    const statuses = await getPublicStatuses();
    const query = { status: { $in: statuses } };

    if (search) {
      query.productName = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (sellerId && mongoose.Types.ObjectId.isValid(sellerId)) {
      query.sellerId = sellerId;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortQuery = { createdAt: -1 };
    if (sort === 'price_asc') sortQuery = { price: 1 };
    if (sort === 'price_desc') sortQuery = { price: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit))
      .populate('sellerId', 'storeName storeLogo')
      .select('productName price discountPrice productImages category skuCode stockQuantity sellerId')
      .lean();

    const productsWithRatings = await attachRatings(products);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        products: productsWithRatings,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

const getProductDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const statuses = await getPublicStatuses();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid product id'));
    }

    const product = await Product.findById(id).populate('sellerId', 'storeName storeLogo');
    if (!product || !statuses.includes(product.status)) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    const reviews = await Review.find({ product: id }).populate('buyerId', 'name').sort({ createdAt: -1 }).limit(10);

    let avgRating = 0;
    if (reviews.length > 0) {
      avgRating = reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length;
    }

    res.status(200).json({
      success: true,
      data: {
        product,
        reviews,
        avgRating,
      }
    });
  } catch (err) {
    next(err);
  }
};

const getPublicStores = async (req, res, next) => {
  try {
    const User = mongoose.model('User');
    const sellers = await User.find({
      role: 'seller',
      status: 'active',
      profileCompleted: true,
    })
      .select('storeName storeLogo storeDescription createdAt')
      .lean();

    const storeIds = sellers.map(s => s._id);
    const productCounts = await Product.aggregate([
      { $match: { sellerId: { $in: storeIds }, status: 'approved' } },
      { $group: { _id: '$sellerId', count: { $sum: 1 } } }
    ]);

    const countMap = new Map(productCounts.map(c => [String(c._id), c.count]));

    const data = sellers.map(seller => ({
      ...seller,
      productCount: countMap.get(String(seller._id)) || 0
    }));

    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHomeData,
  searchProducts,
  getProductDetails,
  getPublicStores,
};
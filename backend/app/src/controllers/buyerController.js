const mongoose = require('mongoose');
const Product = require('../models/Product');
const Review = require('../models/Review');
const User = require('../models/User');

const PUBLIC_STATUSES =
  process.env.PUBLIC_INCLUDE_PENDING_PRODUCTS === 'true' || process.env.NODE_ENV !== 'production'
    ? ['approved', 'pending']
    : ['approved'];

const getPublicStatuses = () => PUBLIC_STATUSES;

const escapeRegex = (input = '') => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
    const statuses = getPublicStatuses();

    const [featuredProducts, categories] = await Promise.all([
      Product.find({ status: { $in: statuses } })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('productName price discountPrice productImages category skuCode stockQuantity')
        .lean(),
      Product.distinct('category', { status: { $in: statuses } }),
    ]);

    const featuredWithRatings = await attachRatings(featuredProducts);

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
    const statuses = getPublicStatuses();
    const query = { status: { $in: statuses } };
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(50, Math.max(1, Number(limit) || 20));

    if (search) {
      query.productName = { $regex: escapeRegex(String(search).trim()), $options: 'i' };
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

    const skip = (pageNumber - 1) * limitNumber;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNumber)
        .populate('sellerId', 'storeName storeLogo')
        .select('productName price discountPrice productImages category skuCode stockQuantity sellerId')
        .lean(),
      Product.countDocuments(query),
    ]);

    const productsWithRatings = await attachRatings(products);

    res.status(200).json({
      success: true,
      data: {
        products: productsWithRatings,
        pagination: {
          total,
          page: pageNumber,
          pages: Math.ceil(total / limitNumber),
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
    const statuses = getPublicStatuses();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid product id'));
    }

    const product = await Product.findById(id)
      .populate('sellerId', 'storeName storeLogo storeFaqs')
      .lean();
    if (!product || !statuses.includes(product.status)) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    let store = null;

    if (product.sellerId && typeof product.sellerId === 'object' && product.sellerId._id) {
      store = {
        _id: String(product.sellerId._id),
        storeName: product.sellerId.storeName,
        storeLogo: product.sellerId.storeLogo,
        storeFaqs: Array.isArray(product.sellerId.storeFaqs) ? product.sellerId.storeFaqs : [],
      };
    } else if (product.sellerId && mongoose.Types.ObjectId.isValid(String(product.sellerId))) {
      const seller = await User.findById(product.sellerId)
        .select('storeName storeLogo storeFaqs')
        .lean();

      if (seller) {
        store = {
          _id: String(seller._id),
          storeName: seller.storeName,
          storeLogo: seller.storeLogo,
          storeFaqs: Array.isArray(seller.storeFaqs) ? seller.storeFaqs : [],
        };
      }
    }

    const productData = { ...product };
    if (store) {
      productData.sellerId = store;
    }

    const [reviews, ratingRows] = await Promise.all([
      Review.find({ product: id })
        .populate('buyerId', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(id) } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
          },
        },
      ]),
    ]);

    const avgRating = Number((ratingRows[0]?.avgRating || 0).toFixed(1));

    res.status(200).json({
      success: true,
      data: {
        product: productData,
        store,
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
    const sellers = await User.find({
      role: 'seller',
      status: 'active',
      profileCompleted: true,
    })
      .select('storeName storeLogo storeDescription createdAt')
      .lean();

    if (sellers.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

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
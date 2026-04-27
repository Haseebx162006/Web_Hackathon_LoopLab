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

    const featuredOnly = await Product.find({ status: { $in: statuses }, isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('productName price discountPrice productImages category skuCode stockQuantity isFeatured')
      .lean();

    const productsToShow = featuredOnly.length > 0
      ? featuredOnly
      : await Product.find({ status: { $in: statuses } })
          .sort({ createdAt: -1 })
          .limit(8)
          .select('productName price discountPrice productImages category skuCode stockQuantity isFeatured')
          .lean();

    const categories = await Product.distinct('category', { status: { $in: statuses } });

    const featuredWithRatings = await attachRatings(productsToShow);

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
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (pageNumber - 1) * limitNumber;

    // Build aggregation pipeline
    const pipeline = [];

    // Initial match for status
    const matchStage = { status: { $in: statuses } };

    if (search) {
      matchStage.productName = { $regex: escapeRegex(String(search).trim()), $options: 'i' };
    }
    if (category) {
      matchStage.category = category;
    }
    if (sellerId && mongoose.Types.ObjectId.isValid(sellerId)) {
      matchStage.sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    pipeline.push({ $match: matchStage });

    // Add effectivePrice field for filtering and sorting
    pipeline.push({
      $addFields: {
        effectivePrice: {
          $cond: {
            if: { $and: [{ $ne: ['$discountPrice', null] }, { $gt: ['$discountPrice', 0] }] },
            then: '$discountPrice',
            else: '$price'
          }
        }
      }
    });

    // Price filtering on effectivePrice
    if (minPrice || maxPrice) {
      const priceMatch = {};
      if (minPrice) priceMatch.$gte = Number(minPrice);
      if (maxPrice) priceMatch.$lte = Number(maxPrice);
      pipeline.push({ $match: { effectivePrice: priceMatch } });
    }

    // Count total before pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    
    // Sorting
    let sortStage = { createdAt: -1 };
    if (sort === 'price_asc') sortStage = { effectivePrice: 1 };
    if (sort === 'price_desc') sortStage = { effectivePrice: -1 };
    pipeline.push({ $sort: sortStage });

    // Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNumber });

    // Lookup seller info
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'sellerId',
        foreignField: '_id',
        as: 'sellerInfo'
      }
    });

    // Format seller data
    pipeline.push({
      $addFields: {
        sellerId: {
          $cond: {
            if: { $gt: [{ $size: '$sellerInfo' }, 0] },
            then: {
              _id: { $arrayElemAt: ['$sellerInfo._id', 0] },
              storeName: { $arrayElemAt: ['$sellerInfo.storeName', 0] },
              storeLogo: { $arrayElemAt: ['$sellerInfo.storeLogo', 0] }
            },
            else: '$sellerId'
          }
        }
      }
    });

    // Project only needed fields
    pipeline.push({
      $project: {
        productName: 1,
        price: 1,
        discountPrice: 1,
        productImages: 1,
        category: 1,
        skuCode: 1,
        stockQuantity: 1,
        sellerId: 1,
        effectivePrice: 1
      }
    });

    // Execute both queries
    const [products, countResult] = await Promise.all([
      Product.aggregate(pipeline),
      Product.aggregate(countPipeline)
    ]);

    const total = countResult[0]?.total || 0;
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
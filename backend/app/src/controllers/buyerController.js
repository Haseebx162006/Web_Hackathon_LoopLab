const mongoose = require('mongoose');
const Product = require('../models/Product');
const Review = require('../models/Review');

const getHomeData = async (req, res, next) => {
  try {
    const featuredProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('productName price discountPrice images category rating skuCode');

    const categories = await Product.distinct('category');

    res.status(200).json({
      success: true,
      data: {
        featuredProducts,
        categories,
        banners: [] // Placeholder for banners
      }
    });
  } catch (err) {
    next(err);
  }
};

const searchProducts = async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;

    const query = {};

    if (search) {
      query.productName = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = category;
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
      .select('productName price discountPrice images category rating skuCode');

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        products,
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid product id'));
    }

    const product = await Product.findById(id).populate('sellerId', 'storeName storeLogo');
    if (!product) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    const reviews = await Review.find({ product: id }).populate('buyerId', 'name').sort({ createdAt: -1 }).limit(10);

    // Compute rating average
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

module.exports = {
  getHomeData,
  searchProducts,
  getProductDetails,
};
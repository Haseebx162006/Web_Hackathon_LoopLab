const { z } = require('zod');
const Product = require('../models/Product');
const { adminUpdateProductSchema } = require('../utils/validators');
const logger = require('../utils/logger');

const getAllProducts = async (req, res, next) => {
  try {
    const { status, isFlagged, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (isFlagged !== undefined) query.isFlagged = isFlagged === 'true';
    if (search) {
      query.productName = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .populate('sellerId', 'storeName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate('sellerId', 'storeName email');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

const approveProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.status = 'approved';
    await product.save();
    
    logger.info(`[AUDIT] Admin ${req.user.email} approved product ${product._id}`);
    res.status(200).json({ success: true, data: { id: product._id, status: product.status } });
  } catch (err) {
    next(err);
  }
};

const rejectProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.status = 'rejected';
    await product.save();
    
    logger.info(`[AUDIT] Admin ${req.user.email} rejected product ${product._id}`);
    res.status(200).json({ success: true, data: { id: product._id, status: product.status } });
  } catch (err) {
    next(err);
  }
};

const flagProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Assuming body will carry { isFlagged: boolean }, or we just toggle it.
    // Let's use the explicit body flag.
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.isFlagged = req.body.isFlagged !== undefined ? req.body.isFlagged : true;
    await product.save();
    
    logger.info(`[AUDIT] Admin ${req.user.email} flagged product ${product._id} (${product.isFlagged})`);
    res.status(200).json({ success: true, data: { id: product._id, isFlagged: product.isFlagged } });
  } catch (err) {
    next(err);
  }
};

const getTopProductsByOrders = async (req, res, next) => {
  try {
    const Order = require('../models/Order');

    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          orderCount: { $sum: '$items.quantity' },
        },
      },
      { $sort: { orderCount: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: '$product._id',
          productName: '$product.productName',
          productImages: '$product.productImages',
          price: '$product.price',
          discountPrice: '$product.discountPrice',
          category: '$product.category',
          isFeatured: '$product.isFeatured',
          orderCount: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, data: topProducts });
  } catch (err) {
    next(err);
  }
};

const toggleFeaturedProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;

    if (isFeatured === true) {
      const currentFeaturedCount = await Product.countDocuments({ isFeatured: true });
      if (currentFeaturedCount >= 8) {
        return res.status(400).json({
          success: false,
          message: 'Maximum of 8 featured products allowed. Remove one before featuring another.',
        });
      }
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { isFeatured: Boolean(isFeatured) },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    logger.info(`[AUDIT] Admin ${req.user.email} ${isFeatured ? 'featured' : 'unfeatured'} product ${product._id}`);
    res.status(200).json({ success: true, data: { id: product._id, isFeatured: product.isFeatured } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  approveProduct,
  rejectProduct,
  flagProduct,
  getTopProductsByOrders,
  toggleFeaturedProduct,
};
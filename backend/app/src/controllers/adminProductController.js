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

module.exports = {
  getAllProducts,
  approveProduct,
  rejectProduct,
  flagProduct,
};
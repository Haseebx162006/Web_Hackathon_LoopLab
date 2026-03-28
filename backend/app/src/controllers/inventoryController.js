const mongoose = require('mongoose');
const Product = require('../models/Product');
const { inventoryUpdateSchema, bulkInventoryBodySchema } = require('../utils/validators');

const defaultThreshold = () => Number(process.env.LOW_STOCK_THRESHOLD) || 10;

const sellerId = (req) => req.user._id;

const getInventory = async (req, res, next) => {
  try {
    const threshold =
      req.query.threshold != null && req.query.threshold !== ''
        ? Number(req.query.threshold)
        : defaultThreshold();

    if (Number.isNaN(threshold)) {
      res.status(400);
      return next(new Error('Invalid threshold'));
    }

    const products = await Product.find({ sellerId: sellerId(req) })
      .select('productName skuCode stockQuantity')
      .sort({ productName: 1 })
      .lean();

    const data = products.map((p) => ({
      productName: p.productName,
      skuCode: p.skuCode,
      stockQuantity: p.stockQuantity,
      lowStock: p.stockQuantity < threshold,
    }));

    res.status(200).json({
      success: true,
      threshold,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid product id'));
    }

    const body = inventoryUpdateSchema.parse(req.body);
    const product = await Product.findOneAndUpdate(
      { _id: id, sellerId: sellerId(req) },
      { $set: { stockQuantity: body.stockQuantity } },
      { new: true, runValidators: true }
    );

    if (!product) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

const bulkUpdateStock = async (req, res, next) => {
  let session;
  try {
    const { items } = bulkInventoryBodySchema.parse(req.body);

    const skuList = items.map((i) => i.skuCode);
    if (new Set(skuList).size !== skuList.length) {
      res.status(400);
      return next(new Error('Duplicate skuCode in request'));
    }

    const sid = sellerId(req);

    session = await mongoose.startSession();
    session.startTransaction();

    const existing = await Product.find({
      sellerId: sid,
      skuCode: { $in: skuList },
    })
      .select('skuCode')
      .session(session)
      .lean();

    const foundSkus = new Set(existing.map((p) => p.skuCode));
    const missing = skuList.filter((s) => !foundSkus.has(s));
    if (missing.length > 0) {
      await session.abortTransaction();
      res.status(400);
      return next(
        new Error(
          `Unknown or inaccessible SKU(s) for this seller: ${missing.join(', ')}`
        )
      );
    }

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { sellerId: sid, skuCode: item.skuCode },
        update: { $set: { stockQuantity: item.newStockQuantity } },
      },
    }));

    await Product.bulkWrite(bulkOps, { session, ordered: true });

    const updated = await Product.find({
      sellerId: sid,
      skuCode: { $in: skuList },
    })
      .session(session)
      .sort({ skuCode: 1 });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      updated: updated.length,
      products: updated,
    });
  } catch (err) {
    if (session) {
      await session.abortTransaction().catch(() => {});
    }
    next(err);
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

module.exports = {
  getInventory,
  updateStock,
  bulkUpdateStock,
};

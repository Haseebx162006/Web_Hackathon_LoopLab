const mongoose = require('mongoose');
const XLSX = require('xlsx');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const {
  productCreateSchema,
  productUpdateSchema,
  productBulkRowSchema,
} = require('../utils/validators');

const sellerId = (req) => req.user._id;

function normalizeKeys(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[String(k).trim().toLowerCase().replace(/\s+/g, '')] = v;
  }
  return out;
}

function parseVariantsCell(raw) {
  if (raw == null || raw === '') return [];
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    return Object.entries(raw).map(([key, value]) => ({
      key: String(key),
      value: String(value),
    }));
  }
  const s = String(raw).trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((x) => x && typeof x === 'object' && x.key != null && x.value != null)
        .map((x) => ({ key: String(x.key), value: String(x.value) }));
    }
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.entries(parsed).map(([key, value]) => ({
        key: String(key),
        value: String(value),
      }));
    }
  } catch {
    // ignore
  }
  return [];
}

function parseImagesCell(raw) {
  if (raw == null || raw === '') return [];
  return String(raw)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function coerceExcelRow(row) {
  const n = normalizeKeys(row);
  const price = n.price !== '' && n.price != null ? Number(n.price) : NaN;
  const disc = n.discountprice ?? n.discount;
  let discountPrice = null;
  if (disc !== '' && disc != null && !Number.isNaN(Number(disc))) {
    discountPrice = Number(disc);
  }
  const stockRaw = n.stockquantity ?? n.stock;
  const stockQuantity =
    stockRaw !== '' && stockRaw != null ? parseInt(String(stockRaw), 10) : NaN;

  return {
    productName: n.productname != null ? String(n.productname).trim() : '',
    description: n.description != null ? String(n.description).trim() : '',
    category: n.category != null ? String(n.category).trim() : '',
    price,
    discountPrice,
    variants: parseVariantsCell(n.variants),
    skuCode: n.skucode != null ? String(n.skucode).trim() : '',
    stockQuantity,
    productImages: parseImagesCell(n.productimages ?? n.images),
  };
}

function handleDuplicateSku(err, res, next) {
  if (err.code === 11000) {
    res.status(400);
    return next(new Error('SKU code already exists'));
  }
  return next(err);
}


// Product Crud
const createProduct = async (req, res, next) => {
  try {
    const body = productCreateSchema.parse(req.body);
    const product = await Product.create({
      ...body,
      sellerId: sellerId(req),
    });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400);
      return next(new Error('SKU code already exists'));
    }
    next(err);
  }
};

const listProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ sellerId: sellerId(req) }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid product id'));
    }
    const body = productUpdateSchema.parse(req.body);
    if (Object.keys(body).length === 0) {
      res.status(400);
      return next(new Error('No fields to update'));
    }

    const existing = await Product.findOne({ _id: id, sellerId: sellerId(req) });
    if (!existing) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    if (body.skuCode && body.skuCode !== existing.skuCode) {
      const taken = await Product.findOne({ skuCode: body.skuCode, _id: { $ne: id } });
      if (taken) {
        res.status(400);
        return next(new Error('SKU code already exists'));
      }
    }

    Object.assign(existing, body);
    await existing.save();
    res.status(200).json({ success: true, data: existing });
  } catch (err) {
    handleDuplicateSku(err, res, next);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid product id'));
    }
    const deleted = await Product.findOneAndDelete({ _id: id, sellerId: sellerId(req) });
    if (!deleted) {
      res.status(404);
      return next(new Error('Product not found'));
    }
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

// Expected sheet columns (row 1): productName, description, category, price, discountPrice (optional),
// skuCode, stockQuantity, variants (JSON object or array of {key,value}), productImages (comma-separated URLs)
const bulkProductsFromExcel = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      res.status(400);
      return next(new Error('Excel file is required (field name: file)'));
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      res.status(400);
      return next(new Error('Workbook is empty'));
    }
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const created = [];
    const errors = [];
    const skuBatch = new Set();

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const coerced = coerceExcelRow(rows[i]);
      const parsed = productBulkRowSchema.safeParse(coerced);
      if (!parsed.success) {
        errors.push({
          row: rowNum,
          message: parsed.error.issues.map((x) => x.message).join('; '),
        });
        continue;
      }

      const data = parsed.data;
      if (skuBatch.has(data.skuCode)) {
        errors.push({ row: rowNum, message: `Duplicate SKU in file: ${data.skuCode}` });
        continue;
      }
      skuBatch.add(data.skuCode);

      const exists = await Product.findOne({ skuCode: data.skuCode });
      if (exists) {
        errors.push({ row: rowNum, message: `SKU already exists: ${data.skuCode}` });
        continue;
      }

      try {
        const product = await Product.create({
          ...data,
          sellerId: sellerId(req),
        });
        created.push(product);
      } catch (err) {
        if (err.code === 11000) {
          errors.push({ row: rowNum, message: `SKU already exists: ${data.skuCode}` });
        } else {
          logger.error('Bulk row create failed', err);
          errors.push({ row: rowNum, message: err.message || 'Save failed' });
        }
      }
    }

    res.status(200).json({
      success: true,
      summary: {
        totalRows: rows.length,
        created: created.length,
        failed: errors.length,
      },
      created,
      errors,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProduct,
  listProducts,
  updateProduct,
  deleteProduct,
  bulkProductsFromExcel,
};

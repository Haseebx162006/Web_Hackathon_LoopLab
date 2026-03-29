const mongoose = require('mongoose');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const { uploadImage } = require('../utils/cloudinary');
const { getDynamicPriceSuggestion } = require('../services/pricingService');
const { validatePrice, toNonNegativeNumber } = require('../utils/pricingUtils');
const {
  productCreateSchema,
  productUpdateSchema,
  productBulkRowSchema,
} = require('../utils/validators');

let xlsxLib = null;

const getXlsx = () => {
  if (!xlsxLib) {
    xlsxLib = require('xlsx');
  }
  return xlsxLib;
};

const sellerId = (req) => req.user._id;

function normalizeKeys(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[String(k).trim().toLowerCase().replace(/\s+/g, '')] = v;
  }
  return out;
}

const BULK_FIELD_ALIASES = {
  productName: ['productname', 'product', 'name'],
  description: ['description', 'details'],
  category: ['category'],
  price: ['price'],
  discountPrice: ['discountprice', 'discount'],
  skuCode: ['skucode', 'sku'],
  stockQuantity: ['stockquantity', 'stock', 'quantity'],
  variants: ['variants', 'variant'],
  productImages: ['productimages', 'images', 'imageurls', 'imageurl'],
};

const getColumnLabel = (index) => {
  let n = index + 1;
  let label = '';

  while (n > 0) {
    const remainder = (n - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    n = Math.floor((n - 1) / 26);
  }

  return label;
};

const buildHeaderMeta = (sheet, xlsx) => {
  const grid = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headerRow = Array.isArray(grid[0]) ? grid[0] : [];
  const normalized = new Map();

  headerRow.forEach((cell, index) => {
    const header = String(cell ?? '').trim();
    if (!header) {
      return;
    }

    const key = header.toLowerCase().replace(/\s+/g, '');
    if (!normalized.has(key)) {
      normalized.set(key, {
        header,
        index,
        label: getColumnLabel(index),
      });
    }
  });

  return normalized;
};

const resolveFieldColumn = (headerMeta, fieldName) => {
  const aliases = BULK_FIELD_ALIASES[fieldName] || [];
  for (const alias of aliases) {
    if (headerMeta.has(alias)) {
      return headerMeta.get(alias);
    }
  }
  return null;
};

const getFieldValue = (normalizedRow, aliases) => {
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(normalizedRow, alias)) {
      return normalizedRow[alias];
    }
  }
  return '';
};

const formatColumnRef = (fieldColumns, fieldName) => {
  const meta = fieldColumns[fieldName];
  if (!meta) {
    return `Missing column (${fieldName})`;
  }
  return `${meta.label} (${meta.header})`;
};

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

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomToken(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

function buildAutoSku(rowNum) {
  return `AUTO-${Date.now().toString(36).toUpperCase()}-${rowNum}-${randomToken(4)}`;
}

function applyBulkFallbacks(rawData, rowNum, fieldColumns) {
  const data = { ...rawData };
  const rowWarnings = [];

  const pushWarning = (field, message, autoValue) => {
    rowWarnings.push({
      row: rowNum,
      column: formatColumnRef(fieldColumns, field),
      field,
      productName: data.productName || `Row ${rowNum}`,
      message,
      autoValue,
    });
  };

  if (!data.productName || !String(data.productName).trim()) {
    data.productName = `Imported Product ${rowNum}-${randomToken(3)}`;
    pushWarning('productName', 'Required value missing. Dummy value generated.', data.productName);
  }

  if (!data.description || !String(data.description).trim()) {
    data.description = `Auto-generated description for imported product row ${rowNum}.`;
    pushWarning('description', 'Required value missing. Dummy value generated.', data.description);
  }

  if (!data.category || !String(data.category).trim()) {
    data.category = 'General';
    pushWarning('category', 'Required value missing. Dummy value generated.', data.category);
  }

  if (!Number.isFinite(data.price) || data.price < 0) {
    data.price = randomInt(10, 500);
    pushWarning('price', 'Required value missing or invalid. Dummy value generated.', data.price);
  }

  if (!data.skuCode || !String(data.skuCode).trim()) {
    data.skuCode = buildAutoSku(rowNum);
    pushWarning('skuCode', 'Required value missing. Dummy value generated.', data.skuCode);
  }

  if (!Number.isInteger(data.stockQuantity) || data.stockQuantity < 0) {
    data.stockQuantity = randomInt(1, 50);
    pushWarning('stockQuantity', 'Required value missing or invalid. Dummy value generated.', data.stockQuantity);
  }

  if (data.discountPrice != null && (!Number.isFinite(data.discountPrice) || data.discountPrice < 0)) {
    data.discountPrice = null;
    pushWarning('discountPrice', 'Invalid value detected. Cleared to null.', null);
  }

  if (
    typeof data.discountPrice === 'number' &&
    Number.isFinite(data.discountPrice) &&
    data.discountPrice > data.price
  ) {
    data.discountPrice = Number(Math.max(0, data.price * 0.8).toFixed(2));
    pushWarning('discountPrice', 'Discount exceeded price. Value adjusted automatically.', data.discountPrice);
  }

  if (!Array.isArray(data.variants)) {
    data.variants = [];
  }

  if (!Array.isArray(data.productImages)) {
    data.productImages = [];
  }

  return { data, rowWarnings };
}

function coerceExcelRow(row, headerMeta) {
  const n = normalizeKeys(row);
  const get = (fieldName) => getFieldValue(n, BULK_FIELD_ALIASES[fieldName] || []);

  const priceRaw = get('price');
  const discountRaw = get('discountPrice');
  const stockRaw = get('stockQuantity');

  const price = priceRaw !== '' && priceRaw != null ? Number(priceRaw) : NaN;
  let discountPrice = null;
  if (discountRaw !== '' && discountRaw != null && !Number.isNaN(Number(discountRaw))) {
    discountPrice = Number(discountRaw);
  }
  const stockQuantity =
    stockRaw !== '' && stockRaw != null ? parseInt(String(stockRaw), 10) : NaN;

  const fieldColumns = {
    productName: resolveFieldColumn(headerMeta, 'productName'),
    description: resolveFieldColumn(headerMeta, 'description'),
    category: resolveFieldColumn(headerMeta, 'category'),
    price: resolveFieldColumn(headerMeta, 'price'),
    discountPrice: resolveFieldColumn(headerMeta, 'discountPrice'),
    variants: resolveFieldColumn(headerMeta, 'variants'),
    skuCode: resolveFieldColumn(headerMeta, 'skuCode'),
    stockQuantity: resolveFieldColumn(headerMeta, 'stockQuantity'),
    productImages: resolveFieldColumn(headerMeta, 'productImages'),
  };

  return {
    data: {
      productName: String(get('productName') ?? '').trim(),
      description: String(get('description') ?? '').trim(),
      category: String(get('category') ?? '').trim(),
      price,
      discountPrice,
      variants: parseVariantsCell(get('variants')),
      skuCode: String(get('skuCode') ?? '').trim(),
      stockQuantity,
      productImages: parseImagesCell(get('productImages')),
    },
    fieldColumns,
  };
}

function handleDuplicateSku(err, res, next) {
  if (err.code === 11000) {
    res.status(400);
    return next(new Error('SKU code already exists'));
  }
  return next(err);
}

const getCostPriceFromRequest = (req) => {
  const rawCostPrice = req?.body?.costPrice;
  return toNonNegativeNumber(rawCostPrice);
};


// Product Crud
const createProduct = async (req, res, next) => {
  try {
    const body = productCreateSchema.parse(req.body);

    let pricingSuggestion = null;
    try {
      pricingSuggestion = await getDynamicPriceSuggestion({
        productName: body.productName,
        category: body.category,
        inputPrice: body.price,
        costPrice: getCostPriceFromRequest(req),
        stockQuantity: body.stockQuantity,
      });
    } catch (pricingError) {
      logger.warn('Product pricing suggestion failed', {
        sellerId: String(sellerId(req)),
        skuCode: body.skuCode,
        message: pricingError?.message || 'Unknown pricing suggestion error',
      });
    }

    const product = await Product.create({
      ...body,
      sellerId: sellerId(req),
    });

    const priceCheck = pricingSuggestion
      ? validatePrice(body.price, pricingSuggestion)
      : { status: 'unknown', warning: null };

    res.status(201).json({
      success: true,
      data: product,
      pricingSuggestion: pricingSuggestion
        ? {
            ...pricingSuggestion,
            warning: priceCheck.warning,
            priceStatus: priceCheck.status,
          }
        : null,
    });
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
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { sellerId: sellerId(req) };
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
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

    const XLSX = getXlsx();
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      res.status(400);
      return next(new Error('Workbook is empty'));
    }
    const sheet = workbook.Sheets[sheetName];
    const headerMeta = buildHeaderMeta(sheet, XLSX);
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const created = [];
    const errors = [];
    const warnings = [];
    const skuBatch = new Set();
    const validRows = [];
    const currentSellerId = sellerId(req);

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const { data: coerced, fieldColumns } = coerceExcelRow(rows[i], headerMeta);
      const { data: preparedRow, rowWarnings } = applyBulkFallbacks(coerced, rowNum, fieldColumns);
      if (rowWarnings.length > 0) {
        warnings.push(...rowWarnings);
      }

      const parsed = productBulkRowSchema.safeParse(preparedRow);
      if (!parsed.success) {
        parsed.error.issues.forEach((issue) => {
          const issueField = typeof issue.path?.[0] === 'string' ? issue.path[0] : 'row';
          errors.push({
            row: rowNum,
            column: formatColumnRef(fieldColumns, issueField),
            field: issueField,
            productName: preparedRow.productName || `Row ${rowNum}`,
            message: issue.message,
          });
        });
        continue;
      }

      const data = parsed.data;

      if (skuBatch.has(data.skuCode)) {
        errors.push({
          row: rowNum,
          column: formatColumnRef(fieldColumns, 'skuCode'),
          field: 'skuCode',
          productName: data.productName,
          message: `Duplicate SKU in file: ${data.skuCode}`,
        });
        continue;
      }

      skuBatch.add(data.skuCode);
      validRows.push({
        rowNum,
        data,
        fieldColumns,
      });
    }

    if (validRows.length > 0) {
      const existingSkuDocs = await Product.find({
        skuCode: { $in: validRows.map((entry) => entry.data.skuCode) },
      })
        .select('skuCode -_id')
        .lean();

      const existingSkuSet = new Set(existingSkuDocs.map((doc) => doc.skuCode));

      const rowsToInsert = [];
      const rowBySku = new Map();

      validRows.forEach((entry) => {
        if (existingSkuSet.has(entry.data.skuCode)) {
          errors.push({
            row: entry.rowNum,
            column: formatColumnRef(entry.fieldColumns, 'skuCode'),
            field: 'skuCode',
            productName: entry.data.productName,
            message: `SKU already exists: ${entry.data.skuCode}`,
          });
          return;
        }

        rowsToInsert.push({
          ...entry.data,
          sellerId: currentSellerId,
        });
        rowBySku.set(entry.data.skuCode, entry);
      });

      if (rowsToInsert.length > 0) {
        try {
          const insertedDocs = await Product.insertMany(rowsToInsert, { ordered: false });
          created.push(...insertedDocs);
        } catch (err) {
          if (Array.isArray(err.insertedDocs) && err.insertedDocs.length > 0) {
            created.push(...err.insertedDocs);
          }

          if (Array.isArray(err.writeErrors) && err.writeErrors.length > 0) {
            err.writeErrors.forEach((writeError) => {
              const op =
                writeError?.err?.op ||
                (typeof writeError?.getOperation === 'function' ? writeError.getOperation() : null) ||
                writeError?.op;

              const opSku = op?.skuCode;
              const rowMeta = opSku ? rowBySku.get(opSku) : null;

              errors.push({
                row: rowMeta?.rowNum || 0,
                column: formatColumnRef(rowMeta?.fieldColumns || {}, 'skuCode'),
                field: 'skuCode',
                productName: rowMeta?.data?.productName || 'Unknown Product',
                message:
                  writeError?.errmsg ||
                  writeError?.err?.errmsg ||
                  writeError?.message ||
                  'Bulk insert error',
              });
            });
          } else {
            throw err;
          }
        }
      }
    }

    const failedRows = new Set(errors.map((issue) => issue.row).filter((row) => row > 0)).size;
    const unknownFailures = errors.filter((issue) => !issue.row || issue.row <= 0).length;

    res.status(200).json({
      success: true,
      summary: {
        totalRows: rows.length,
        created: created.length,
        failed: failedRows + unknownFailures,
        warned: warnings.length,
      },
      created,
      warnings,
      errors,
    });
  } catch (err) {
    next(err);
  }
};

const uploadProductImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid product id'));
    }

    if (!req.files || req.files.length === 0) {
      res.status(400);
      return next(new Error('No images provided'));
    }

    const product = await Product.findOne({ _id: id, sellerId: sellerId(req) });
    if (!product) {
      res.status(404);
      return next(new Error('Product not found or unauthorized'));
    }

    const uploadPromises = req.files.map((file) => uploadImage(file.buffer));
    const urls = await Promise.all(uploadPromises);

    product.productImages.push(...urls);
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

const getProductImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      return next(new Error('Invalid product id'));
    }

    const product = await Product.findById(id);
    if (!product) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    res.status(200).json({
      success: true,
      data: product.productImages,
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
  uploadProductImages,
  getProductImages,
};

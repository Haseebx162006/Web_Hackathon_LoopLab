const Product = require('../models/Product');
const SearchHistory = require('../models/SearchHistory');
const { autocompleteQuerySchema } = require('../utils/validators');

const escapeRegex = (input = '') => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const AUTOCOMPLETE_PRODUCT_LIMIT = 12;
const AUTOCOMPLETE_CATEGORY_LIMIT = 5;
const POPULAR_SEARCH_LIMIT = 5;

const autocomplete = async (req, res, next) => {
  try {
    const { q } = autocompleteQuerySchema.parse(req.query);
    const trimmed = q.trim().toLowerCase();
    const escapedPrefix = escapeRegex(trimmed);

    const [products, popularSearches] = await Promise.all([
      Product.find({
        status: 'approved',
        $or: [
          { productName: { $regex: `^${escapedPrefix}`, $options: 'i' } },
          { category: { $regex: `^${escapedPrefix}`, $options: 'i' } },
        ],
      })
        .select('productName category')
        .sort({ createdAt: -1 })
        .limit(AUTOCOMPLETE_PRODUCT_LIMIT)
        .lean(),
      SearchHistory.find({
        query: { $regex: `^${escapedPrefix}`, $options: 'i' },
      })
        .sort({ count: -1 })
        .limit(POPULAR_SEARCH_LIMIT)
        .select('query count -_id')
        .lean(),
    ]);

    // Extract unique product name suggestions
    const seen = new Set();
    const productSuggestions = [];
    for (const product of products) {
      const name = product.productName;
      if (!seen.has(name)) {
        seen.add(name);
        productSuggestions.push({
          productName: name,
          category: product.category,
          score: 0,
        });
      }
    }

    // Extract distinct categories from matched products
    const categorySet = new Set();
    for (const product of products) {
      if (product.category) {
        categorySet.add(product.category);
      }
    }
    const categorySuggestions = Array.from(categorySet).slice(0, AUTOCOMPLETE_CATEGORY_LIMIT);

    // Track this search (fire-and-forget)
    SearchHistory.updateOne(
      { query: trimmed },
      {
        $inc: { count: 1 },
        $set: { lastSearchedAt: new Date() },
      },
      { upsert: true }
    ).catch(() => {
      // Silently ignore tracking errors
    });

    return res.status(200).json({
      success: true,
      data: {
        products: productSuggestions,
        categories: categorySuggestions,
        popularSearches,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { autocomplete };

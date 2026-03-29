const Fuse = require('fuse.js');
const Product = require('../models/Product');
const SearchHistory = require('../models/SearchHistory');
const { autocompleteQuerySchema } = require('../utils/validators');

// In-memory cache for autocomplete product list (5 minute TTL)
let _cachedProducts = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

const getCachedProducts = async () => {
  const now = Date.now();
  if (_cachedProducts && (now - _cacheTimestamp) < CACHE_TTL_MS) {
    return _cachedProducts;
  }
  _cachedProducts = await Product.find({ status: 'approved' })
    .select('productName category')
    .lean();
  _cacheTimestamp = now;
  return _cachedProducts;
};

const autocomplete = async (req, res, next) => {
  try {
    const { q } = autocompleteQuerySchema.parse(req.query);
    const trimmed = q.trim().toLowerCase();

    // Use cached products to avoid full table scan per keystroke
    const products = await getCachedProducts();

    // Build Fuse.js index with typo tolerance
    const fuse = new Fuse(products, {
      keys: ['productName', 'category'],
      threshold: 0.4,
      distance: 100,
      includeScore: true,
      minMatchCharLength: 1,
    });

    const fuseResults = fuse.search(trimmed, { limit: 10 });

    // Extract unique product name suggestions
    const seen = new Set();
    const productSuggestions = [];
    for (const result of fuseResults) {
      const name = result.item.productName;
      if (!seen.has(name)) {
        seen.add(name);
        productSuggestions.push({
          productName: name,
          category: result.item.category,
          score: result.score,
        });
      }
    }

    // Extract distinct categories from results
    const categorySet = new Set();
    for (const result of fuseResults) {
      categorySet.add(result.item.category);
    }
    const categorySuggestions = Array.from(categorySet).slice(0, 5);

    // Fetch popular past searches matching the prefix
    const popularSearches = await SearchHistory.find({
      query: { $regex: `^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, $options: 'i' },
    })
      .sort({ count: -1 })
      .limit(5)
      .select('query count -_id')
      .lean();

    // Track this search (fire-and-forget)
    SearchHistory.findOneAndUpdate(
      { query: trimmed },
      {
        $inc: { count: 1 },
        $set: { lastSearchedAt: new Date() },
      },
      { upsert: true, new: true }
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

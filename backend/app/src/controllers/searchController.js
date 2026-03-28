const Fuse = require('fuse.js');
const Product = require('../models/Product');
const SearchHistory = require('../models/SearchHistory');
const { autocompleteQuerySchema } = require('../utils/validators');

const autocomplete = async (req, res, next) => {
  try {
    const { q } = autocompleteQuerySchema.parse(req.query);
    const trimmed = q.trim().toLowerCase();

    // Fetch approved products for fuzzy search
    const products = await Product.find({ status: 'approved' })
      .select('productName category')
      .lean();

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

const Product = require('../models/Product');
const Order = require('../models/Order');
const { getPricingAIRecommendation } = require('../utils/grokClient');
const { normalizePriceSuggestion, toNonNegativeNumber } = require('../utils/pricingUtils');

const STATS_CACHE_TTL_MS = Number.parseInt(process.env.PRICING_STATS_CACHE_TTL_MS || '120000', 10);
const STATS_CACHE_MAX_SIZE = Number.parseInt(process.env.PRICING_STATS_CACHE_MAX_SIZE || '200', 10);
const SIMILAR_PRODUCTS_LIMIT = Math.min(
  50,
  Math.max(5, Number.parseInt(process.env.PRICING_SIMILAR_PRODUCTS_LIMIT || '20', 10))
);

const REVENUE_RECOGNIZED_STATUSES = ['processing', 'confirmed', 'packed', 'shipped', 'delivered'];

const marketStatsCache = new Map();

const buildCacheKey = (category) => String(category || '').trim().toLowerCase();

const isCacheEntryFresh = (cacheEntry) => {
  if (!cacheEntry) {
    return false;
  }

  return Date.now() - cacheEntry.createdAt <= STATS_CACHE_TTL_MS;
};

const getCachedMarketStats = (cacheKey) => {
  const cached = marketStatsCache.get(cacheKey);
  if (!isCacheEntryFresh(cached)) {
    marketStatsCache.delete(cacheKey);
    return null;
  }

  return cached.value;
};

const setCachedMarketStats = (cacheKey, value) => {
  if (marketStatsCache.size >= STATS_CACHE_MAX_SIZE) {
    const oldestKey = marketStatsCache.keys().next().value;
    if (oldestKey) {
      marketStatsCache.delete(oldestKey);
    }
  }

  marketStatsCache.set(cacheKey, {
    createdAt: Date.now(),
    value,
  });
};

const createEmptyMarketStats = (category) => ({
  category,
  sampleSize: 0,
  avgPrice: 0,
  minPrice: 0,
  maxPrice: 0,
  avgStock: 0,
  totalUnitsSold: 0,
  demandScore: 0,
});

const average = (values) => {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
};

const computeDemandScore = (totalUnitsSold, sampleSize) => {
  if (sampleSize <= 0) {
    return 0;
  }

  const unitsPerProduct = totalUnitsSold / sampleSize;
  return Math.max(0, Math.min(1, unitsPerProduct / 10));
};

const getEffectiveProductPrice = (product) => {
  const discountPrice = toNonNegativeNumber(product.discountPrice);
  const regularPrice = toNonNegativeNumber(product.price);

  if (discountPrice !== undefined) {
    return discountPrice;
  }

  return regularPrice !== undefined ? regularPrice : 0;
};

const getMarketStats = async (category) => {
  const normalizedCategory = String(category || '').trim();
  if (!normalizedCategory) {
    return createEmptyMarketStats(normalizedCategory);
  }

  const cacheKey = buildCacheKey(normalizedCategory);
  const cachedStats = getCachedMarketStats(cacheKey);
  if (cachedStats) {
    return cachedStats;
  }

  const similarProducts = await Product.find({
    category: normalizedCategory,
    status: 'approved',
  })
    .select('_id price discountPrice stockQuantity')
    .sort({ createdAt: -1 })
    .limit(SIMILAR_PRODUCTS_LIMIT)
    .lean();

  if (similarProducts.length === 0) {
    const emptyStats = createEmptyMarketStats(normalizedCategory);
    setCachedMarketStats(cacheKey, emptyStats);
    return emptyStats;
  }

  const productIds = similarProducts.map((product) => product._id);

  const demandRows = await Order.aggregate([
    {
      $match: {
        status: { $in: REVENUE_RECOGNIZED_STATUSES },
        refundStatus: { $ne: 'completed' },
        'items.product': { $in: productIds },
      },
    },
    { $unwind: '$items' },
    {
      $match: {
        'items.product': { $in: productIds },
      },
    },
    {
      $group: {
        _id: '$items.product',
        unitsSold: { $sum: '$items.quantity' },
      },
    },
  ]);

  const prices = similarProducts
    .map(getEffectiveProductPrice)
    .filter((price) => Number.isFinite(price) && price > 0);

  const stocks = similarProducts
    .map((product) => toNonNegativeNumber(product.stockQuantity) || 0)
    .filter((value) => Number.isFinite(value));

  const totalUnitsSold = demandRows.reduce((sum, row) => sum + (Number(row.unitsSold) || 0), 0);

  const marketStats = {
    category: normalizedCategory,
    sampleSize: similarProducts.length,
    avgPrice: average(prices),
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    avgStock: average(stocks),
    totalUnitsSold,
    demandScore: computeDemandScore(totalUnitsSold, similarProducts.length),
  };

  setCachedMarketStats(cacheKey, marketStats);
  return marketStats;
};

const buildFallbackSuggestion = (productInput, marketStats) => {
  const inputPrice = toNonNegativeNumber(productInput.inputPrice);
  const costPrice = toNonNegativeNumber(productInput.costPrice);
  const stockQuantity = toNonNegativeNumber(productInput.stockQuantity);

  const basePrice =
    marketStats.avgPrice ||
    inputPrice ||
    (costPrice !== undefined ? costPrice * 1.25 : 100);

  const demandAdjustment = (marketStats.demandScore - 0.5) * 0.24;

  let stockAdjustment = 0;
  if (stockQuantity !== undefined && marketStats.avgStock > 0) {
    if (stockQuantity < marketStats.avgStock * 0.6) {
      stockAdjustment = 0.05;
    } else if (stockQuantity > marketStats.avgStock * 1.4) {
      stockAdjustment = -0.05;
    }
  }

  const recommendedPrice = basePrice * (1 + demandAdjustment + stockAdjustment);

  let minPrice = recommendedPrice * 0.88;
  let maxPrice = recommendedPrice * 1.15;

  if (marketStats.minPrice > 0) {
    minPrice = Math.max(minPrice, marketStats.minPrice * 0.85);
  }

  if (marketStats.maxPrice > 0) {
    maxPrice = Math.max(maxPrice, marketStats.maxPrice * 1.05);
  }

  if (costPrice !== undefined) {
    minPrice = Math.max(minPrice, costPrice * 1.03);
    maxPrice = Math.max(maxPrice, costPrice * 1.25);
  }

  const confidence = marketStats.sampleSize >= 8 ? 0.74 : marketStats.sampleSize >= 3 ? 0.66 : 0.58;

  const reasonParts = [];
  if (marketStats.demandScore >= 0.7) {
    reasonParts.push('High demand trend in this category');
  } else if (marketStats.demandScore <= 0.3) {
    reasonParts.push('Demand is currently moderate to low');
  } else {
    reasonParts.push('Demand is steady');
  }

  if (stockQuantity !== undefined && marketStats.avgStock > 0) {
    if (stockQuantity < marketStats.avgStock * 0.6) {
      reasonParts.push('Low stock supports stronger pricing');
    } else if (stockQuantity > marketStats.avgStock * 1.4) {
      reasonParts.push('High stock supports competitive pricing');
    }
  }

  return {
    recommendedPrice,
    minPrice,
    maxPrice,
    confidence,
    reason: reasonParts.join('. '),
  };
};

const getDynamicPriceSuggestion = async (productInput) => {
  const marketStats = await getMarketStats(productInput.category);

  const fallbackSuggestion = buildFallbackSuggestion(productInput, marketStats);

  const payload = {
    product: {
      name: productInput.productName,
      category: productInput.category,
      inputPrice: toNonNegativeNumber(productInput.inputPrice),
      costPrice: toNonNegativeNumber(productInput.costPrice),
      stockQuantity: toNonNegativeNumber(productInput.stockQuantity),
    },
    marketStats: {
      sampleSize: marketStats.sampleSize,
      avgPrice: marketStats.avgPrice,
      minPrice: marketStats.minPrice,
      maxPrice: marketStats.maxPrice,
      demandScore: marketStats.demandScore,
      avgStock: marketStats.avgStock,
      totalUnitsSold: marketStats.totalUnitsSold,
    },
  };

  let aiSuggestion = null;
  if (process.env.PRICING_AI_DISABLED !== 'true') {
    aiSuggestion = await getPricingAIRecommendation(payload);
  }

  if (!aiSuggestion) {
    const normalizedFallback = normalizePriceSuggestion(fallbackSuggestion, {
      inputPrice: productInput.inputPrice,
      costPrice: productInput.costPrice,
      fallbackPrice: fallbackSuggestion.recommendedPrice,
    });

    return {
      ...normalizedFallback,
      source: 'fallback',
    };
  }

  const normalizedAiSuggestion = normalizePriceSuggestion(
    {
      ...fallbackSuggestion,
      ...aiSuggestion,
      reason: aiSuggestion.reason || fallbackSuggestion.reason,
      confidence: aiSuggestion.confidence ?? aiSuggestion.confidenceScore ?? fallbackSuggestion.confidence,
    },
    {
      inputPrice: productInput.inputPrice,
      costPrice: productInput.costPrice,
      fallbackPrice: fallbackSuggestion.recommendedPrice,
    }
  );

  return {
    ...normalizedAiSuggestion,
    source: 'ai',
  };
};

module.exports = {
  getMarketStats,
  getDynamicPriceSuggestion,
};

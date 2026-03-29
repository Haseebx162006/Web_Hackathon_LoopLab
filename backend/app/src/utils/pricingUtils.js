const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const roundCurrency = (value) => Math.round(value * 100) / 100;

const toNonNegativeNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
};

const normalizePriceSuggestion = (rawSuggestion = {}, context = {}) => {
  const fallbackPrice =
    toNonNegativeNumber(context.fallbackPrice) ||
    toNonNegativeNumber(context.inputPrice) ||
    0;

  let recommendedPrice = toNonNegativeNumber(rawSuggestion.recommendedPrice);
  let minPrice = toNonNegativeNumber(rawSuggestion.minPrice);
  let maxPrice = toNonNegativeNumber(rawSuggestion.maxPrice);

  if (recommendedPrice === undefined) {
    recommendedPrice = fallbackPrice;
  }

  if (recommendedPrice <= 0) {
    recommendedPrice = 1;
  }

  if (minPrice === undefined && maxPrice === undefined) {
    minPrice = recommendedPrice * 0.9;
    maxPrice = recommendedPrice * 1.1;
  } else if (minPrice === undefined) {
    minPrice = Math.min(recommendedPrice, maxPrice * 0.9);
  } else if (maxPrice === undefined) {
    maxPrice = Math.max(recommendedPrice, minPrice * 1.1);
  }

  if (minPrice > maxPrice) {
    const swap = minPrice;
    minPrice = maxPrice;
    maxPrice = swap;
  }

  recommendedPrice = clamp(recommendedPrice, minPrice, maxPrice);

  const costPrice = toNonNegativeNumber(context.costPrice);
  if (costPrice !== undefined) {
    const minimumCostFloor = costPrice * 1.02;
    minPrice = Math.max(minPrice, minimumCostFloor);
    recommendedPrice = Math.max(recommendedPrice, minimumCostFloor);
    maxPrice = Math.max(maxPrice, recommendedPrice * 1.05);
  }

  const rawConfidence = rawSuggestion.confidence ?? rawSuggestion.confidenceScore;
  const confidence = clamp(Number.isFinite(Number(rawConfidence)) ? Number(rawConfidence) : 0.55, 0, 1);

  const reason =
    typeof rawSuggestion.reason === 'string' && rawSuggestion.reason.trim()
      ? rawSuggestion.reason.trim().slice(0, 280)
      : 'Based on market prices, demand trends, and available stock.';

  return {
    recommendedPrice: roundCurrency(recommendedPrice),
    minPrice: roundCurrency(minPrice),
    maxPrice: roundCurrency(maxPrice),
    confidence: Number(confidence.toFixed(2)),
    reason,
  };
};

const validatePrice = (inputPrice, suggestion) => {
  const normalizedInputPrice = toNonNegativeNumber(inputPrice);
  if (normalizedInputPrice === undefined || !suggestion) {
    return {
      status: 'unknown',
      warning: null,
    };
  }

  if (normalizedInputPrice > suggestion.maxPrice) {
    return {
      status: 'high',
      warning: 'Price is too high',
    };
  }

  if (normalizedInputPrice < suggestion.minPrice) {
    return {
      status: 'low',
      warning: 'Price is too low',
    };
  }

  return {
    status: 'ok',
    warning: null,
  };
};

module.exports = {
  normalizePriceSuggestion,
  validatePrice,
  toNonNegativeNumber,
};

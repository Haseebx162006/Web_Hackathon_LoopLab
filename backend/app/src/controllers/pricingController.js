const { pricingSuggestionSchema } = require('../utils/validators');
const { getDynamicPriceSuggestion } = require('../services/pricingService');
const { validatePrice } = require('../utils/pricingUtils');

const suggestDynamicPrice = async (req, res, next) => {
  try {
    const body = pricingSuggestionSchema.parse(req.body);

    const inputPrice = body.inputPrice ?? body.price;

    const suggestion = await getDynamicPriceSuggestion({
      productName: body.productName,
      category: body.category,
      inputPrice,
      costPrice: body.costPrice,
      stockQuantity: body.stockQuantity,
    });

    const priceCheck = validatePrice(inputPrice, suggestion);

    res.status(200).json({
      success: true,
      data: {
        recommendedPrice: suggestion.recommendedPrice,
        minPrice: suggestion.minPrice,
        maxPrice: suggestion.maxPrice,
        confidence: suggestion.confidence,
        reason: suggestion.reason,
        warning: priceCheck.warning,
        priceStatus: priceCheck.status,
        source: suggestion.source,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  suggestDynamicPrice,
};

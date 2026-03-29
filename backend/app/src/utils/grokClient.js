const Groq = require('groq-sdk');
const logger = require('./logger');

const PRICING_MODEL = process.env.GROQ_PRICING_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const PRICING_TIMEOUT_MS = Number.parseInt(process.env.GROQ_PRICING_TIMEOUT_MS || '4000', 10);

const withTimeout = async (promise, timeoutMs) => {
  const safeTimeout = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 4000;

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Grok pricing request timed out'));
      }, safeTimeout);
    }),
  ]);
};

const extractJsonObject = (text) => {
  if (typeof text !== 'string' || !text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const toNumberOrUndefined = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parsePricingResponse = (text) => {
  const parsed = extractJsonObject(text);
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const recommendedPrice = toNumberOrUndefined(parsed.recommendedPrice);
  const minPrice = toNumberOrUndefined(parsed.minPrice);
  const maxPrice = toNumberOrUndefined(parsed.maxPrice);

  if (
    recommendedPrice === undefined ||
    minPrice === undefined ||
    maxPrice === undefined ||
    recommendedPrice < 0 ||
    minPrice < 0 ||
    maxPrice < 0
  ) {
    return null;
  }

  return {
    recommendedPrice,
    minPrice,
    maxPrice,
    confidence: toNumberOrUndefined(parsed.confidence ?? parsed.confidenceScore),
    reason: typeof parsed.reason === 'string' ? parsed.reason.trim() : '',
  };
};

const getPricingAIRecommendation = async (payload) => {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await withTimeout(
      groq.chat.completions.create({
        model: PRICING_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a dynamic pricing analyst for a marketplace. Return JSON only with keys: recommendedPrice, minPrice, maxPrice, confidence, reason. Keep reason under 25 words.',
          },
          {
            role: 'user',
            content: JSON.stringify(payload),
          },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
      PRICING_TIMEOUT_MS
    );

    const content = completion?.choices?.[0]?.message?.content;
    const suggestion = parsePricingResponse(content);

    if (!suggestion) {
      logger.warn('Grok pricing response could not be parsed');
      return null;
    }

    return suggestion;
  } catch (error) {
    logger.warn('Grok pricing request failed', {
      message: error?.message || 'Unknown Grok error',
    });
    return null;
  }
};

module.exports = {
  getPricingAIRecommendation,
};

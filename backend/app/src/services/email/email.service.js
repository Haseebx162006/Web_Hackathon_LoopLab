const bcrypt = require('bcrypt');
const EmailOtp = require('../../models/EmailOtp');
const logger = require('../../utils/logger');
const {
  buildOtpTemplate,
  buildOrderPlacedTemplate,
  buildOrderStatusTemplate,
} = require('./email.templates');
const {
  getEmailDefaults,
  getTransporter,
  isEmailConfigured,
  isEmailPreviewEnabled,
} = require('./email.config');
const {
  enqueueEmailJob,
  getEmailQueueMode,
  setEmailQueueProcessor,
} = require('./email.queue');
const {
  generateOtpCode,
  maskEmail,
  retryWithExponentialBackoff,
  sanitizeEmailAddress,
  sanitizeHeaderText,
  withTimeout,
} = require('./email.utils');

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_RATE_LIMIT_MAX = Number(process.env.OTP_RATE_LIMIT_MAX) || 3;
const OTP_RATE_LIMIT_WINDOW_MS = Number(process.env.OTP_RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000;
const EMAIL_MAX_ATTEMPTS = Number(process.env.EMAIL_MAX_RETRIES) || 3;
const OTP_PURPOSES = new Set(['signup', 'login', 'password_reset']);

const createServiceError = (message, extras = {}) => {
  const error = new Error(message);
  Object.assign(error, extras);
  return error;
};

const normalizePurpose = (purpose) => {
  const normalized = String(purpose || 'signup').trim();
  if (!OTP_PURPOSES.has(normalized)) {
    throw createServiceError('Invalid OTP purpose', { statusCode: 400, code: 'OTP_PURPOSE_INVALID' });
  }
  return normalized;
};

const normalizeOrderItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => {
    const productSource = item && item.product && typeof item.product === 'object' ? item.product : null;
    return {
      productName: sanitizeHeaderText(
        item?.productName || productSource?.productName || productSource?.name || 'Product',
        140
      ),
      quantity: Math.max(1, Number(item?.quantity) || 1),
      priceAtPurchase: Math.max(0, Number(item?.priceAtPurchase) || 0),
    };
  });
};

const normalizeOrderIdentity = (value, fallbackName) => {
  if (value && typeof value === 'object') {
    return {
      id: String(value._id || value.id || ''),
      name: sanitizeHeaderText(value.name || value.storeName || fallbackName || ''),
      email: sanitizeEmailAddress(value.email),
    };
  }

  return {
    id: String(value || ''),
    name: sanitizeHeaderText(fallbackName || ''),
    email: '',
  };
};

const normalizeShippingAddress = (shippingAddress) => {
  if (!shippingAddress || typeof shippingAddress !== 'object') {
    return {};
  }

  return {
    street: sanitizeHeaderText(shippingAddress.street || '', 140),
    city: sanitizeHeaderText(shippingAddress.city || '', 120),
    state: sanitizeHeaderText(shippingAddress.state || '', 120),
    country: sanitizeHeaderText(shippingAddress.country || '', 120),
    zipCode: sanitizeHeaderText(shippingAddress.zipCode || '', 50),
  };
};

const normalizeOrderPayload = (orderData = {}) => {
  const buyer = normalizeOrderIdentity(orderData.buyer || orderData.buyerId, 'Buyer');
  const seller = normalizeOrderIdentity(orderData.seller || orderData.sellerId, 'Seller');

  return {
    orderId: sanitizeHeaderText(orderData.orderId || orderData._id || '', 80),
    status: sanitizeHeaderText(orderData.status || 'pending', 40).toLowerCase(),
    trackingId: sanitizeHeaderText(orderData.trackingId || '', 100),
    items: normalizeOrderItems(orderData.items),
    totalAmount: Math.max(0, Number(orderData.totalAmount) || 0),
    shippingAddress: normalizeShippingAddress(orderData.shippingAddress),
    buyer,
    seller,
  };
};

const sendEmailWithReliability = async ({ to, subject, html, text, context }) => {
  const sanitizedTo = sanitizeEmailAddress(to);
  const sanitizedSubject = sanitizeHeaderText(subject, 255);

  if (!sanitizedTo) {
    throw createServiceError('Invalid destination email address', {
      statusCode: 400,
      code: 'EMAIL_INVALID_TO',
    });
  }

  if (!isEmailConfigured()) {
    logger.warn('Email send skipped because OAuth2 credentials are not configured', {
      to: maskEmail(sanitizedTo),
      context,
    });

    if (isEmailPreviewEnabled()) {
      logger.info('Email preview (service disabled)', {
        to: maskEmail(sanitizedTo),
        context,
        subject: sanitizedSubject,
      });
    }

    return { skipped: true };
  }

  const { from, timeoutMs } = getEmailDefaults();

  return retryWithExponentialBackoff(
    async (attempt) => {
      const transporter = await getTransporter({ forceRefresh: attempt > 1 });

      const sendResult = await withTimeout(
        transporter.sendMail({
          from,
          to: sanitizedTo,
          subject: sanitizedSubject,
          html,
          text,
        }),
        timeoutMs,
        'email send'
      );

      logger.info('Email sent successfully', {
        to: maskEmail(sanitizedTo),
        context,
        attempt,
        messageId: sendResult.messageId,
      });

      return sendResult;
    },
    {
      maxAttempts: EMAIL_MAX_ATTEMPTS,
      baseDelayMs: 500,
      maxDelayMs: 5000,
      onRetry: ({ attempt, error, delayMs, nextAttempt }) => {
        logger.warn('Email send failed, retrying', {
          context,
          to: maskEmail(sanitizedTo),
          attempt,
          nextAttempt,
          delayMs,
          error: error.message,
        });
      },
    }
  );
};

const processOtpJob = async (payload) => {
  const template = buildOtpTemplate(payload);
  return sendEmailWithReliability({
    to: payload.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    context: 'otp',
  });
};

const processOrderPlacedJob = async (payload) => {
  const template = buildOrderPlacedTemplate(payload);
  return sendEmailWithReliability({
    to: payload.sellerEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    context: 'order_placed',
  });
};

const processOrderStatusJob = async (payload) => {
  const template = buildOrderStatusTemplate(payload);
  return sendEmailWithReliability({
    to: payload.buyerEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    context: `order_status_${payload.status}`,
  });
};

const processEmailJob = async (jobName, payload) => {
  switch (jobName) {
    case 'otp.send':
      return processOtpJob(payload);
    case 'order.placed':
      return processOrderPlacedJob(payload);
    case 'order.status':
      return processOrderStatusJob(payload);
    default:
      throw createServiceError(`Unsupported email job "${jobName}"`, {
        code: 'EMAIL_JOB_UNSUPPORTED',
      });
  }
};

setEmailQueueProcessor(processEmailJob);

const sendOTP = async (email, purpose = 'signup') => {
  const normalizedEmail = sanitizeEmailAddress(email);
  const normalizedPurpose = normalizePurpose(purpose);

  if (!normalizedEmail) {
    throw createServiceError('Invalid email address', { statusCode: 400, code: 'OTP_EMAIL_INVALID' });
  }

  const now = Date.now();

  const otpRecord = (await EmailOtp.findOne({ email: normalizedEmail })) ||
    new EmailOtp({ email: normalizedEmail, purpose: normalizedPurpose });

  const windowStartedAt = otpRecord.requestWindowStartedAt
    ? otpRecord.requestWindowStartedAt.getTime()
    : 0;

  if (!windowStartedAt || now - windowStartedAt >= OTP_RATE_LIMIT_WINDOW_MS) {
    otpRecord.requestWindowStartedAt = new Date(now);
    otpRecord.requestCount = 0;
  }

  if ((otpRecord.requestCount || 0) >= OTP_RATE_LIMIT_MAX) {
    const retryAt = otpRecord.requestWindowStartedAt.getTime() + OTP_RATE_LIMIT_WINDOW_MS;
    const retryAfterSeconds = Math.max(1, Math.ceil((retryAt - now) / 1000));
    throw createServiceError('Too many OTP requests. Try again later.', {
      statusCode: 429,
      code: 'OTP_RATE_LIMIT',
      retryAfterSeconds,
    });
  }

  const otpCode = generateOtpCode();
  otpRecord.purpose = normalizedPurpose;
  otpRecord.otpHash = await bcrypt.hash(otpCode, 12);
  otpRecord.expiresAt = new Date(now + OTP_EXPIRY_MS);
  otpRecord.lastRequestedAt = new Date(now);
  otpRecord.requestCount = (otpRecord.requestCount || 0) + 1;
  otpRecord.attemptCount = 0;
  otpRecord.verifiedAt = null;

  await otpRecord.save();

  const queueResult = await enqueueEmailJob('otp.send', {
    email: normalizedEmail,
    otpCode,
    purpose: normalizedPurpose,
    expiresInMinutes: Math.floor(OTP_EXPIRY_MS / (60 * 1000)),
  });

  logger.info('OTP queued', {
    email: maskEmail(normalizedEmail),
    purpose: normalizedPurpose,
    queueMode: queueResult.mode,
  });

  return {
    queued: true,
    queueMode: queueResult.mode,
    expiresInSeconds: Math.floor(OTP_EXPIRY_MS / 1000),
  };
};

const verifyOTP = async (email, otp, purpose = 'signup') => {
  const normalizedEmail = sanitizeEmailAddress(email);
  const normalizedPurpose = normalizePurpose(purpose);
  const otpCode = String(otp || '').trim();

  if (!normalizedEmail) {
    throw createServiceError('Invalid email address', { statusCode: 400, code: 'OTP_EMAIL_INVALID' });
  }

  if (!/^\d{6}$/.test(otpCode)) {
    return { verified: false, reason: 'invalid_format' };
  }

  const otpRecord = await EmailOtp.findOne({ email: normalizedEmail }).select('+otpHash');

  if (!otpRecord || !otpRecord.otpHash || !otpRecord.expiresAt) {
    return { verified: false, reason: 'not_found' };
  }

  if (otpRecord.purpose !== normalizedPurpose) {
    return { verified: false, reason: 'purpose_mismatch' };
  }

  if (otpRecord.expiresAt.getTime() < Date.now()) {
    otpRecord.otpHash = null;
    otpRecord.expiresAt = null;
    await otpRecord.save();
    return { verified: false, reason: 'expired' };
  }

  const matches = await bcrypt.compare(otpCode, otpRecord.otpHash);

  if (!matches) {
    otpRecord.attemptCount = (otpRecord.attemptCount || 0) + 1;
    await otpRecord.save();
    return { verified: false, reason: 'invalid' };
  }

  otpRecord.otpHash = null;
  otpRecord.expiresAt = null;
  otpRecord.attemptCount = 0;
  otpRecord.verifiedAt = new Date();
  await otpRecord.save();

  return {
    verified: true,
    verifiedAt: otpRecord.verifiedAt,
  };
};

const resendOTP = async (email, purpose = 'signup') => sendOTP(email, purpose);

const sendOrderPlacedEmail = async (orderData) => {
  const normalizedOrder = normalizeOrderPayload(orderData);
  const sellerEmail = sanitizeEmailAddress(
    orderData?.sellerEmail || normalizedOrder.seller.email || orderData?.seller?.email
  );

  if (!sellerEmail) {
    logger.warn('Order placed email skipped because seller email is missing', {
      orderId: normalizedOrder.orderId,
    });
    return { queued: false, skipped: true, reason: 'missing_seller_email' };
  }

  const queueResult = await enqueueEmailJob('order.placed', {
    orderId: normalizedOrder.orderId,
    sellerName: normalizedOrder.seller.name || 'Seller',
    sellerEmail,
    buyerName: normalizedOrder.buyer.name || 'Buyer',
    buyerEmail: normalizedOrder.buyer.email || sanitizeEmailAddress(orderData?.buyerEmail),
    shippingAddress: normalizedOrder.shippingAddress,
    items: normalizedOrder.items,
    totalAmount: normalizedOrder.totalAmount,
  });

  logger.info('Order placed email queued', {
    orderId: normalizedOrder.orderId,
    queueMode: queueResult.mode,
  });

  return {
    queued: true,
    queueMode: queueResult.mode,
  };
};

const sendOrderStatusEmail = async (orderData) => {
  const normalizedOrder = normalizeOrderPayload(orderData);
  const buyerEmail = sanitizeEmailAddress(
    orderData?.buyerEmail || normalizedOrder.buyer.email || orderData?.buyer?.email
  );

  if (!buyerEmail) {
    logger.warn('Order status email skipped because buyer email is missing', {
      orderId: normalizedOrder.orderId,
      status: normalizedOrder.status,
    });
    return { queued: false, skipped: true, reason: 'missing_buyer_email' };
  }

  const queueResult = await enqueueEmailJob('order.status', {
    orderId: normalizedOrder.orderId,
    buyerEmail,
    buyerName: normalizedOrder.buyer.name || 'Buyer',
    sellerName: normalizedOrder.seller.name || 'Seller',
    status: normalizedOrder.status,
    trackingId: normalizedOrder.trackingId,
    items: normalizedOrder.items,
  });

  logger.info('Order status email queued', {
    orderId: normalizedOrder.orderId,
    status: normalizedOrder.status,
    queueMode: queueResult.mode,
  });

  return {
    queued: true,
    queueMode: queueResult.mode,
  };
};

const getEmailRuntimeInfo = () => ({
  configured: isEmailConfigured(),
  queueMode: getEmailQueueMode(),
  otpExpirySeconds: Math.floor(OTP_EXPIRY_MS / 1000),
  otpRateLimit: {
    max: OTP_RATE_LIMIT_MAX,
    windowMs: OTP_RATE_LIMIT_WINDOW_MS,
  },
});

module.exports = {
  getEmailRuntimeInfo,
  resendOTP,
  sendOrderPlacedEmail,
  sendOrderStatusEmail,
  sendOTP,
  verifyOTP,
};

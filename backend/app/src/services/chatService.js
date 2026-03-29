const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

const CONVERSATION_DELIMITER = '|';
const CONVERSATION_NONE = 'none';
const MAX_IMAGES_PER_MESSAGE = 5;

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const sanitizeMessageText = (value = '') => {
  const raw = String(value);
  const withoutTags = raw.replace(/<[^>]*>/g, '');
  return withoutTags.replace(/[\u0000-\u001F\u007F]/g, '').trim();
};

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

const normalizeImageUrls = (imageUrls = []) => {
  if (!Array.isArray(imageUrls)) {
    return [];
  }

  return imageUrls
    .filter((url) => typeof url === 'string')
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, MAX_IMAGES_PER_MESSAGE);
};

const buildConversationId = ({ senderId, receiverId, orderId = null, productId = null }) => {
  const sender = String(senderId);
  const receiver = String(receiverId);

  if (!mongoose.Types.ObjectId.isValid(sender) || !mongoose.Types.ObjectId.isValid(receiver)) {
    throw createHttpError(400, 'Invalid sender or receiver id');
  }

  const participants = [sender, receiver].sort();
  const normalizedOrderId = orderId ? String(orderId) : CONVERSATION_NONE;
  const normalizedProductId = productId ? String(productId) : CONVERSATION_NONE;

  return [participants[0], participants[1], normalizedOrderId, normalizedProductId].join(
    CONVERSATION_DELIMITER
  );
};

const parseConversationId = (conversationId) => {
  if (typeof conversationId !== 'string' || !conversationId.trim()) {
    return null;
  }

  const parts = conversationId.split(CONVERSATION_DELIMITER);
  if (parts.length !== 4) {
    return null;
  }

  const [participantA, participantB, orderPart, productPart] = parts;
  if (!mongoose.Types.ObjectId.isValid(participantA) || !mongoose.Types.ObjectId.isValid(participantB)) {
    return null;
  }

  if (
    orderPart !== CONVERSATION_NONE &&
    !mongoose.Types.ObjectId.isValid(orderPart)
  ) {
    return null;
  }

  if (
    productPart !== CONVERSATION_NONE &&
    !mongoose.Types.ObjectId.isValid(productPart)
  ) {
    return null;
  }

  return {
    participantA,
    participantB,
    orderId: orderPart === CONVERSATION_NONE ? null : orderPart,
    productId: productPart === CONVERSATION_NONE ? null : productPart,
  };
};

const getConversationParticipants = (conversationId) => {
  const parsed = parseConversationId(conversationId);
  if (!parsed) {
    return [];
  }

  return [parsed.participantA, parsed.participantB];
};

const ensureBuyerSellerPair = async ({ senderId, receiverId }) => {
  const [sender, receiver] = await Promise.all([
    User.findById(senderId).select('role status'),
    User.findById(receiverId).select('role status'),
  ]);

  if (!sender || !receiver) {
    throw createHttpError(404, 'Chat participant not found');
  }

  if (receiver.status === 'blocked') {
    throw createHttpError(403, 'Receiver account is blocked');
  }

  const isBuyerSellerPair =
    (sender.role === 'buyer' && receiver.role === 'seller') ||
    (sender.role === 'seller' && receiver.role === 'buyer');

  if (!isBuyerSellerPair) {
    throw createHttpError(403, 'Only buyer and seller accounts can chat');
  }

  const buyerId = sender.role === 'buyer' ? sender._id : receiver._id;
  const sellerId = sender.role === 'seller' ? sender._id : receiver._id;

  return {
    sender,
    receiver,
    buyerId: String(buyerId),
    sellerId: String(sellerId),
  };
};

const validateContextReferences = async ({ orderId, productId, buyerId, sellerId }) => {
  let normalizedOrderId = null;
  let normalizedProductId = null;
  let orderDoc = null;

  if (orderId) {
    const orderIdStr = String(orderId);
    if (!mongoose.Types.ObjectId.isValid(orderIdStr)) {
      throw createHttpError(400, 'Invalid order id');
    }

    orderDoc = await Order.findById(orderIdStr).select('buyerId sellerId items');
    if (!orderDoc) {
      throw createHttpError(404, 'Order not found');
    }

    if (String(orderDoc.buyerId) !== buyerId || String(orderDoc.sellerId) !== sellerId) {
      throw createHttpError(403, 'Order context does not match this buyer-seller pair');
    }

    normalizedOrderId = orderIdStr;
  }

  if (productId) {
    const productIdStr = String(productId);
    if (!mongoose.Types.ObjectId.isValid(productIdStr)) {
      throw createHttpError(400, 'Invalid product id');
    }

    const productDoc = await Product.findById(productIdStr).select('sellerId');
    if (!productDoc) {
      throw createHttpError(404, 'Product not found');
    }

    if (String(productDoc.sellerId) !== sellerId) {
      throw createHttpError(403, 'Product context does not match this seller');
    }

    if (orderDoc) {
      const productInOrder = orderDoc.items.some(
        (item) => String(item.product) === productIdStr
      );

      if (!productInOrder) {
        throw createHttpError(400, 'Product is not part of the referenced order');
      }
    }

    normalizedProductId = productIdStr;
  }

  return {
    orderId: normalizedOrderId,
    productId: normalizedProductId,
  };
};

const assertConversationAccess = async ({ userId, conversationId }) => {
  const parsed = parseConversationId(conversationId);
  if (!parsed) {
    throw createHttpError(400, 'Invalid conversation id');
  }

  const userIdStr = String(userId);
  if (![parsed.participantA, parsed.participantB].includes(userIdStr)) {
    throw createHttpError(403, 'Access denied for this conversation');
  }

  const exists = await Chat.exists({ conversationId });
  if (!exists) {
    throw createHttpError(404, 'Conversation not found');
  }

  return parsed;
};

const createChatMessage = async ({
  senderUser,
  receiverId,
  conversationId,
  message,
  imageUrls,
  orderId,
  productId,
}) => {
  const senderId = String(senderUser?._id || '');
  if (!mongoose.Types.ObjectId.isValid(senderId)) {
    throw createHttpError(401, 'Invalid sender context');
  }

  const normalizedMessage = sanitizeMessageText(message);
  const normalizedImageUrls = normalizeImageUrls(imageUrls);

  if (!normalizedMessage && normalizedImageUrls.length === 0) {
    throw createHttpError(400, 'Message text or at least one image is required');
  }

  let resolvedReceiverId = receiverId ? String(receiverId) : null;
  let resolvedConversationId = null;
  let resolvedOrderId = orderId ? String(orderId) : null;
  let resolvedProductId = productId ? String(productId) : null;

  if (conversationId) {
    const parsed = parseConversationId(conversationId);
    if (!parsed) {
      throw createHttpError(400, 'Invalid conversation id');
    }

    if (![parsed.participantA, parsed.participantB].includes(senderId)) {
      throw createHttpError(403, 'Access denied for this conversation');
    }

    resolvedReceiverId =
      parsed.participantA === senderId ? parsed.participantB : parsed.participantA;

    if (receiverId && String(receiverId) !== resolvedReceiverId) {
      throw createHttpError(400, 'receiverId does not match conversation participants');
    }

    if (orderId && parsed.orderId !== String(orderId)) {
      throw createHttpError(400, 'orderId does not match conversation context');
    }

    if (productId && parsed.productId !== String(productId)) {
      throw createHttpError(400, 'productId does not match conversation context');
    }

    resolvedConversationId = conversationId;
    resolvedOrderId = parsed.orderId;
    resolvedProductId = parsed.productId;
  }

  if (!resolvedReceiverId || !mongoose.Types.ObjectId.isValid(resolvedReceiverId)) {
    throw createHttpError(400, 'receiverId is required for new conversations');
  }

  const { buyerId, sellerId } = await ensureBuyerSellerPair({
    senderId,
    receiverId: resolvedReceiverId,
  });

  const validatedContext = await validateContextReferences({
    orderId: resolvedOrderId,
    productId: resolvedProductId,
    buyerId,
    sellerId,
  });

  if (!resolvedConversationId) {
    resolvedConversationId = buildConversationId({
      senderId,
      receiverId: resolvedReceiverId,
      orderId: validatedContext.orderId,
      productId: validatedContext.productId,
    });
  }

  const createdMessage = await Chat.create({
    conversationId: resolvedConversationId,
    senderId,
    receiverId: resolvedReceiverId,
    orderId: validatedContext.orderId,
    productId: validatedContext.productId,
    message: normalizedMessage,
    imageUrls: normalizedImageUrls,
    status: 'sent',
    conversationResolved: false,
    resolvedAt: null,
    resolvedBySeller: null,
  });

  const hydratedMessage = await Chat.findById(createdMessage._id)
    .populate('senderId', 'name storeName email role storeLogo')
    .populate('receiverId', 'name storeName email role storeLogo')
    .populate('orderId', '_id status totalAmount createdAt')
    .populate('productId', '_id productName skuCode productImages')
    .lean();

  return hydratedMessage;
};

const getConversationsForUser = async ({ userId, page = 1, limit = 20, resolved }) => {
  const userIdStr = String(userId);
  if (!mongoose.Types.ObjectId.isValid(userIdStr)) {
    throw createHttpError(400, 'Invalid user id');
  }

  const safePage = parsePositiveInteger(page, 1);
  const safeLimit = Math.min(parsePositiveInteger(limit, 20), 100);
  const skip = (safePage - 1) * safeLimit;
  const userObjectId = new mongoose.Types.ObjectId(userIdStr);

  const matchStage = {
    $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
  };

  if (typeof resolved === 'boolean') {
    matchStage.conversationResolved = resolved;
  }

  const [aggregationResult] = await Chat.aggregate([
    { $match: matchStage },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$receiverId', userObjectId] },
                  { $eq: ['$status', 'sent'] },
                ],
              },
              1,
              0,
            ],
          },
        },
        totalMessages: { $sum: 1 },
      },
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: safeLimit },
          {
            $addFields: {
              counterpartId: {
                $cond: [
                  { $eq: ['$lastMessage.senderId', userObjectId] },
                  '$lastMessage.receiverId',
                  '$lastMessage.senderId',
                ],
              },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'counterpartId',
              foreignField: '_id',
              as: 'counterpart',
            },
          },
          { $unwind: { path: '$counterpart', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'orders',
              localField: 'lastMessage.orderId',
              foreignField: '_id',
              as: 'orderRef',
            },
          },
          { $unwind: { path: '$orderRef', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'products',
              localField: 'lastMessage.productId',
              foreignField: '_id',
              as: 'productRef',
            },
          },
          { $unwind: { path: '$productRef', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              conversationId: '$_id',
              unreadCount: 1,
              totalMessages: 1,
              conversationResolved: '$lastMessage.conversationResolved',
              resolvedAt: '$lastMessage.resolvedAt',
              resolvedBySeller: '$lastMessage.resolvedBySeller',
              lastMessage: {
                _id: '$lastMessage._id',
                senderId: '$lastMessage.senderId',
                receiverId: '$lastMessage.receiverId',
                message: '$lastMessage.message',
                imageUrls: '$lastMessage.imageUrls',
                status: '$lastMessage.status',
                createdAt: '$lastMessage.createdAt',
                orderId: '$lastMessage.orderId',
                productId: '$lastMessage.productId',
              },
              counterpart: {
                _id: '$counterpart._id',
                role: '$counterpart.role',
                name: '$counterpart.name',
                storeName: '$counterpart.storeName',
                email: '$counterpart.email',
                storeLogo: '$counterpart.storeLogo',
              },
              orderRef: {
                _id: '$orderRef._id',
                status: '$orderRef.status',
                totalAmount: '$orderRef.totalAmount',
                createdAt: '$orderRef.createdAt',
              },
              productRef: {
                _id: '$productRef._id',
                productName: '$productRef.productName',
                skuCode: '$productRef.skuCode',
                productImages: '$productRef.productImages',
              },
            },
          },
        ],
        meta: [{ $count: 'total' }],
      },
    },
  ]);

  const conversations = aggregationResult?.data || [];
  const total = aggregationResult?.meta?.[0]?.total || 0;

  return {
    conversations,
    pagination: {
      total,
      page: safePage,
      pages: Math.max(Math.ceil(total / safeLimit), 1),
      limit: safeLimit,
    },
  };
};

const getConversationMessages = async ({ userId, conversationId, page = 1, limit = 30 }) => {
  await assertConversationAccess({ userId, conversationId });

  const safePage = parsePositiveInteger(page, 1);
  const safeLimit = Math.min(parsePositiveInteger(limit, 30), 100);
  const skip = (safePage - 1) * safeLimit;
  const userObjectId = new mongoose.Types.ObjectId(String(userId));

  const filter = {
    conversationId,
    $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
  };

  const [total, rows] = await Promise.all([
    Chat.countDocuments(filter),
    Chat.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('senderId', 'name storeName email role storeLogo')
      .populate('receiverId', 'name storeName email role storeLogo')
      .populate('orderId', '_id status totalAmount createdAt')
      .populate('productId', '_id productName skuCode productImages')
      .lean(),
  ]);

  return {
    messages: rows.reverse(),
    pagination: {
      total,
      page: safePage,
      pages: Math.max(Math.ceil(total / safeLimit), 1),
      limit: safeLimit,
    },
  };
};

const markConversationSeen = async ({ userId, conversationId }) => {
  await assertConversationAccess({ userId, conversationId });

  const receiverId = new mongoose.Types.ObjectId(String(userId));
  const seenAt = new Date();

  const result = await Chat.updateMany(
    {
      conversationId,
      receiverId,
      status: 'sent',
    },
    {
      $set: {
        status: 'seen',
        seenAt,
      },
    }
  );

  return {
    conversationId,
    seenCount: result.modifiedCount || 0,
    seenAt,
  };
};

const resolveConversationBySeller = async ({ userId, userRole, conversationId }) => {
  if (userRole !== 'seller') {
    throw createHttpError(403, 'Only sellers can resolve conversations');
  }

  await assertConversationAccess({ userId, conversationId });

  const resolvedAt = new Date();

  await Chat.updateMany(
    { conversationId },
    {
      $set: {
        conversationResolved: true,
        resolvedAt,
        resolvedBySeller: userId,
      },
    }
  );

  return {
    conversationId,
    resolved: true,
    resolvedAt,
    resolvedBySeller: userId,
  };
};

module.exports = {
  MAX_IMAGES_PER_MESSAGE,
  buildConversationId,
  parseConversationId,
  getConversationParticipants,
  createHttpError,
  sanitizeMessageText,
  createChatMessage,
  getConversationsForUser,
  getConversationMessages,
  markConversationSeen,
  resolveConversationBySeller,
};

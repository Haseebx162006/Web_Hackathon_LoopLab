const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const {
  chatConversationParamSchema,
  chatConversationQuerySchema,
  chatMessageHistoryQuerySchema,
  chatSendMessageSchema,
} = require('../utils/validators');
const { uploadImage } = require('../utils/cloudinary');
const {
  createChatMessage,
  createHttpError,
  getConversationsForUser,
  getConversationMessages,
  markConversationSeen,
  resolveConversationBySeller,
} = require('../services/chatService');
const {
  emitChatMessage,
  emitConversationResolved,
  emitConversationSeen,
} = require('../sockets/chatSocket');

const hasCloudinaryConfig = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
};

const resolveFileExtension = (file) => {
  const originalExtension = path.extname(file?.originalname || '').toLowerCase();
  if (originalExtension) {
    return originalExtension;
  }

  if (file?.mimetype === 'image/png') {
    return '.png';
  }

  return '.jpg';
};

const saveChatImageLocally = async (file, req) => {
  const extension = resolveFileExtension(file);
  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extension}`;
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'chat');
  const filePath = path.join(uploadsDir, fileName);

  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(filePath, file.buffer);

  const origin = `${req.protocol}://${req.get('host')}`;
  return `${origin}/uploads/chat/${fileName}`;
};

const persistChatImage = async (file, req) => {
  if (!file?.buffer) {
    throw createHttpError(400, 'Invalid image payload');
  }

  if (hasCloudinaryConfig()) {
    try {
      const uploadedUrl = await uploadImage(file.buffer, 'chat-attachments');
      if (uploadedUrl) {
        return uploadedUrl;
      }
    } catch (_) {
      // Fall back to local disk if Cloudinary upload fails.
    }
  }

  return saveChatImageLocally(file, req);
};

const setStatusFromError = (res, error) => {
  if (error?.statusCode && Number.isInteger(error.statusCode)) {
    res.status(error.statusCode);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const query = chatConversationQuerySchema.parse(req.query || {});
    const data = await getConversationsForUser({
      userId: req.user._id,
      page: query.page,
      limit: query.limit,
      resolved: query.resolved,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    setStatusFromError(res, error);
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const params = chatConversationParamSchema.parse(req.params);
    const query = chatMessageHistoryQuerySchema.parse(req.query || {});

    const data = await getConversationMessages({
      userId: req.user._id,
      conversationId: params.conversationId,
      page: query.page,
      limit: query.limit,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    setStatusFromError(res, error);
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const body = chatSendMessageSchema.parse(req.body || {});
    const savedMessage = await createChatMessage({
      senderUser: req.user,
      receiverId: body.receiverId,
      conversationId: body.conversationId,
      orderId: body.orderId,
      productId: body.productId,
      message: body.message,
      imageUrls: body.imageUrls,
    });

    emitChatMessage(savedMessage);

    res.status(201).json({
      success: true,
      data: savedMessage,
    });
  } catch (error) {
    setStatusFromError(res, error);
    next(error);
  }
};

const markSeen = async (req, res, next) => {
  try {
    const params = chatConversationParamSchema.parse(req.params);
    const seenUpdate = await markConversationSeen({
      userId: req.user._id,
      conversationId: params.conversationId,
    });

    emitConversationSeen({
      conversationId: seenUpdate.conversationId,
      seenBy: String(req.user._id),
      seenCount: seenUpdate.seenCount,
      seenAt: seenUpdate.seenAt,
    });

    res.status(200).json({
      success: true,
      data: seenUpdate,
    });
  } catch (error) {
    setStatusFromError(res, error);
    next(error);
  }
};

const resolveConversation = async (req, res, next) => {
  try {
    const params = chatConversationParamSchema.parse(req.params);

    const resolvedData = await resolveConversationBySeller({
      userId: req.user._id,
      userRole: req.user.role,
      conversationId: params.conversationId,
    });

    emitConversationResolved(resolvedData);

    res.status(200).json({
      success: true,
      data: resolvedData,
    });
  } catch (error) {
    setStatusFromError(res, error);
    next(error);
  }
};

const uploadChatImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw createHttpError(400, 'At least one image is required');
    }

    const uploadJobs = req.files.map((file) => persistChatImage(file, req));
    const imageUrls = await Promise.all(uploadJobs);

    res.status(200).json({
      success: true,
      data: {
        imageUrls,
      },
    });
  } catch (error) {
    setStatusFromError(res, error);
    next(error);
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markSeen,
  resolveConversation,
  uploadChatImages,
};

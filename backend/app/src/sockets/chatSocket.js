const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  chatConversationParamSchema,
  chatSendMessageSchema,
} = require('../utils/validators');
const {
  createChatMessage,
  getConversationParticipants,
  markConversationSeen,
  parseConversationId,
} = require('../services/chatService');

let ioInstance = null;

const extractTokenFromSocket = (socket) => {
  const authToken = socket.handshake?.auth?.token;
  if (typeof authToken === 'string' && authToken.trim()) {
    return authToken.replace(/^Bearer\s+/i, '').trim();
  }

  const headerToken = socket.handshake?.headers?.authorization;
  if (typeof headerToken === 'string' && headerToken.startsWith('Bearer ')) {
    return headerToken.split(' ')[1];
  }

  return null;
};

const asMessage = (error) => (error && error.message ? error.message : 'Socket request failed');

const emitChatMessage = (chatMessage) => {
  if (!ioInstance || !chatMessage) {
    return;
  }

  const senderId = String(chatMessage.senderId?._id || chatMessage.senderId || '');
  const receiverId = String(chatMessage.receiverId?._id || chatMessage.receiverId || '');

  if (senderId) {
    ioInstance.to(`user:${senderId}`).emit('chat:message', chatMessage);
  }

  if (receiverId && receiverId !== senderId) {
    ioInstance.to(`user:${receiverId}`).emit('chat:message', chatMessage);
  }
};

const emitConversationSeen = ({ conversationId, seenBy, seenCount, seenAt }) => {
  if (!ioInstance || !conversationId) {
    return;
  }

  const payload = {
    conversationId,
    seenBy,
    seenCount,
    seenAt,
  };

  const participants = getConversationParticipants(conversationId);
  participants.forEach((participantId) => {
    ioInstance.to(`user:${participantId}`).emit('chat:seen', payload);
  });
};

const emitConversationResolved = ({ conversationId, resolved, resolvedAt, resolvedBySeller }) => {
  if (!ioInstance || !conversationId) {
    return;
  }

  const payload = {
    conversationId,
    resolved,
    resolvedAt,
    resolvedBySeller,
  };

  const participants = getConversationParticipants(conversationId);
  participants.forEach((participantId) => {
    ioInstance.to(`user:${participantId}`).emit('chat:resolved', payload);
  });
};

const initializeChatSocket = (io) => {
  ioInstance = io;

  io.use(async (socket, next) => {
    try {
      const token = extractTokenFromSocket(socket);
      if (!token) {
        return next(new Error('Unauthorized socket connection'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Unauthorized socket connection'));
      }

      if (user.status === 'blocked') {
        return next(new Error('Account blocked'));
      }

      if (!['buyer', 'seller'].includes(user.role)) {
        return next(new Error('Only buyer and seller accounts can use chat'));
      }

      socket.user = user;
      return next();
    } catch {
      return next(new Error('Unauthorized socket connection'));
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.user._id);
    socket.join(`user:${userId}`);

    socket.on('chat:joinConversation', (payload = {}, acknowledgement) => {
      try {
        const { conversationId } = chatConversationParamSchema.parse(payload);
        const parsed = parseConversationId(conversationId);

        if (!parsed) {
          throw new Error('Invalid conversation id');
        }

        if (![parsed.participantA, parsed.participantB].includes(userId)) {
          throw new Error('Access denied for this conversation');
        }

        socket.join(`conversation:${conversationId}`);

        if (typeof acknowledgement === 'function') {
          acknowledgement({ success: true, data: { conversationId } });
        }
      } catch (error) {
        if (typeof acknowledgement === 'function') {
          acknowledgement({ success: false, message: asMessage(error) });
        }
      }
    });

    socket.on('chat:leaveConversation', (payload = {}, acknowledgement) => {
      try {
        const { conversationId } = chatConversationParamSchema.parse(payload);
        socket.leave(`conversation:${conversationId}`);

        if (typeof acknowledgement === 'function') {
          acknowledgement({ success: true, data: { conversationId } });
        }
      } catch (error) {
        if (typeof acknowledgement === 'function') {
          acknowledgement({ success: false, message: asMessage(error) });
        }
      }
    });

    socket.on('chat:sendMessage', async (payload = {}, acknowledgement) => {
      try {
        const body = chatSendMessageSchema.parse(payload);
        const savedMessage = await createChatMessage({
          senderUser: socket.user,
          receiverId: body.receiverId,
          conversationId: body.conversationId,
          orderId: body.orderId,
          productId: body.productId,
          message: body.message,
          imageUrls: body.imageUrls,
        });

        emitChatMessage(savedMessage);

        if (typeof acknowledgement === 'function') {
          acknowledgement({ success: true, data: savedMessage });
        }
      } catch (error) {
        if (typeof acknowledgement === 'function') {
          acknowledgement({ success: false, message: asMessage(error) });
        }
      }
    });

    socket.on('chat:markSeen', async (payload = {}, acknowledgement) => {
      try {
        const { conversationId } = chatConversationParamSchema.parse(payload);
        const seenUpdate = await markConversationSeen({
          userId,
          conversationId,
        });

        emitConversationSeen({
          conversationId: seenUpdate.conversationId,
          seenBy: userId,
          seenCount: seenUpdate.seenCount,
          seenAt: seenUpdate.seenAt,
        });

        if (typeof acknowledgement === 'function') {
          acknowledgement({ success: true, data: seenUpdate });
        }
      } catch (error) {
        if (typeof acknowledgement === 'function') {
          acknowledgement({ success: false, message: asMessage(error) });
        }
      }
    });
  });

  return io;
};

module.exports = {
  initializeChatSocket,
  emitChatMessage,
  emitConversationSeen,
  emitConversationResolved,
};

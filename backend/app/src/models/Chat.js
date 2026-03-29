const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
      index: true,
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['sent', 'seen'],
      default: 'sent',
      index: true,
    },
    seenAt: {
      type: Date,
      default: null,
    },
    conversationResolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBySeller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
chatSchema.index({ conversationId: 1, createdAt: -1 });
chatSchema.index({ receiverId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);

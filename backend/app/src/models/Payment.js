const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'wallet', 'cod'],
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true,
      index: true,
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true, // sparse allows multiple nulls if not present
    },
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'completed'],
      default: 'none',
    },

  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
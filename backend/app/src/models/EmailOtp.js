const mongoose = require('mongoose');

const emailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['signup', 'login', 'password_reset'],
      required: true,
      default: 'signup',
    },
    otpHash: {
      type: String,
      default: null,
      select: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    requestWindowStartedAt: {
      type: Date,
      default: Date.now,
    },
    requestCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    attemptCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    lastRequestedAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

emailOtpSchema.index({ email: 1, updatedAt: -1 });

module.exports = mongoose.model('EmailOtp', emailOtpSchema);

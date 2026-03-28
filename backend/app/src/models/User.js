const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
      required: function requiredPassword() {
        return this.oauthProvider == null;
      },
    },
    role: {
      type: String,
      enum: ['buyer', 'seller', 'admin'],
      required: true,
      default: 'buyer',
    },
    // Buyer specific / General fields
    name: {
      type: String,
      trim: true,
    },
    // Seller specific fields
    storeName: { type: String, trim: true },
    ownerName: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    businessAddress: { type: String, trim: true },
    bankDetails: { type: String, trim: true },

    storeLogo: { type: String, trim: true },
    storeDescription: { type: String, trim: true },
    contactDetails: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
    },

    // OAuth and default fields kept for compatibility
    oauthProvider: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  });

module.exports = mongoose.model('User', userSchema);
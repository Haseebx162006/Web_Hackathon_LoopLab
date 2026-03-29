const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    count: {
      type: Number,
      default: 1,
      min: 1,
    },
    lastSearchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

searchHistorySchema.index({ count: -1 });
searchHistorySchema.index({ query: 'text' });
searchHistorySchema.index({ query: 1, count: -1 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);

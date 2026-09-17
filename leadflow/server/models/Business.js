const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    importId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Import',
      index: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedBusinessName: {
      type: String,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    normalizedPhone: {
      type: String,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    normalizedEmail: {
      type: String,
      index: true,
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    mapsUrl: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: Number,
      default: null,
    },
    reviews: {
      type: Number,
      default: null,
    },
    websiteStatus: {
      type: String,
      enum: ['HAS_WEBSITE', 'NO_WEBSITE', 'UNKNOWN'],
      default: 'UNKNOWN',
      index: true,
    },
    rawDetails: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

businessSchema.index({ userId: 1, normalizedBusinessName: 1, city: 1 });
businessSchema.index({ userId: 1, normalizedEmail: 1 });
businessSchema.index({ userId: 1, normalizedPhone: 1 });

module.exports = mongoose.model('Business', businessSchema);


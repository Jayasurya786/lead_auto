const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: String,
      default: 'System',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const leadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
    },
    importId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Import',
      index: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      index: true,
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
      index: true,
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
      index: true,
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
      default: 'NO_WEBSITE',
      index: true,
    },
    leadStatus: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'REPLIED', 'INTERESTED', 'NOT_INTERESTED', 'CONVERTED', 'ARCHIVED'],
      default: 'NEW',
      index: true,
    },
    emailStatus: {
      type: String,
      enum: ['NOT_SENT', 'SENT', 'FAILED', 'FOLLOW_UP_DUE', 'FOLLOW_UP_SENT'],
      default: 'NOT_SENT',
      index: true,
    },
    notes: [noteSchema],
    source: {
      type: String,
      default: 'XLSX Upload',
    },
    nextFollowUpDate: {
      type: Date,
      default: null,
      index: true,
    },
    lastContactedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

leadSchema.index({ userId: 1, normalizedBusinessName: 1, city: 1 });
leadSchema.index({ userId: 1, normalizedEmail: 1 });
leadSchema.index({ userId: 1, normalizedPhone: 1 });
leadSchema.index({ userId: 1, leadStatus: 1, emailStatus: 1 });
leadSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);


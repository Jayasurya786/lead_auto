const mongoose = require('mongoose');

const emailMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    messageId: {
      type: String,
      trim: true,
    },
    threadId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['SENT', 'OPENED', 'FAILED', 'SIMULATED'],
      default: 'SENT',
      index: true,
    },
    error: {
      type: String,
      default: null,
    },
    openedAt: {
      type: Date,
      default: null,
    },
    openCount: {
      type: Number,
      default: 0,
    },
    clickedAt: {
      type: Date,
      default: null,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

emailMessageSchema.index({ userId: 1, sentAt: -1 });

module.exports = mongoose.model('EmailMessage', emailMessageSchema);


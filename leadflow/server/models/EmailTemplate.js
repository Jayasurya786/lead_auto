const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Email body is required'],
    },
    variables: {
      type: [String],
      default: ['business_name', 'contact_name', 'category', 'city', 'sender_name'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

emailTemplateSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);


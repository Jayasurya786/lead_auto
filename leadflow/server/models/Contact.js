const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      default: 'Manual Entry',
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

contactSchema.index({ userId: 1, leadId: 1 });
contactSchema.index({ userId: 1, email: 1 });

module.exports = mongoose.model('Contact', contactSchema);


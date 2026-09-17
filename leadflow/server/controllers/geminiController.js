const { generateAiPitch } = require('../services/geminiService');
const { Lead } = require('../models');

// @desc    Generate AI-crafted personalized outreach pitch
// @route   POST /api/ai/pitch
// @access  Private
const createPitch = async (req, res) => {
  try {
    const { leadId, tone = 'professional' } = req.body;

    let leadData = req.body;

    if (leadId) {
      const lead = await Lead.findOne({ _id: leadId, userId: req.user._id });
      if (lead) {
        leadData = {
          businessName: lead.businessName,
          category: lead.category,
          city: lead.city,
          rating: lead.rating,
          reviews: lead.reviews,
        };
      }
    }

    if (!leadData.businessName) {
      return res.status(400).json({
        success: false,
        message: 'Business name is required for AI pitch generation.',
      });
    }

    const pitch = await generateAiPitch({
      ...leadData,
      senderName: req.user.name || 'Outreach Specialist',
      tone,
    });

    return res.status(200).json({
      success: true,
      data: pitch,
    });
  } catch (error) {
    console.error('AI pitch controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate AI pitch',
    });
  }
};

module.exports = {
  createPitch,
};


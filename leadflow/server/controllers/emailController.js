const { EmailMessage } = require('../models');

// @desc    Get email outreach history
// @route   GET /api/email-history
// @access  Private
const getEmailHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = { userId };
    if (status) query.status = status;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { recipient: searchRegex },
        { subject: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [emails, total] = await Promise.all([
      EmailMessage.find(query)
        .populate('leadId', 'businessName city category')
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limitNum),
      EmailMessage.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: emails,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching email history',
    });
  }
};

// @desc    Get single email message detail
// @route   GET /api/email-history/:id
// @access  Private
const getEmailById = async (req, res) => {
  try {
    const email = await EmailMessage.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('leadId');

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email message not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: email,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching email details',
    });
  }
};

module.exports = {
  getEmailHistory,
  getEmailById,
};


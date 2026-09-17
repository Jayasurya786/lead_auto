const { Lead, EmailMessage, User } = require('../models');
const { sendLeadEmail } = require('../services/gmailSendService');

// @desc    Get follow-ups that are due for review
// @route   GET /api/follow-ups
// @access  Private
const getFollowUps = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const query = {
      userId,
      leadStatus: { $nin: ['CONVERTED', 'NOT_INTERESTED', 'ARCHIVED'] },
      $or: [
        { emailStatus: 'FOLLOW_UP_DUE' },
        { nextFollowUpDate: { $lte: now, $ne: null } },
      ],
    };

    const leads = await Lead.find(query).sort({ nextFollowUpDate: 1 });

    return res.status(200).json({
      success: true,
      count: leads.length,
      data: leads,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching follow-ups',
    });
  }
};

// @desc    Send confirmed follow-up email after user review
// @route   POST /api/follow-ups/:leadId/send
// @access  Private
const sendFollowUp = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { subject, body, simulateIfNoGmail = false, nextDays = 7 } = req.body;

    const lead = await Lead.findOne({ _id: leadId, userId: req.user._id });
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    if (!lead.email) {
      return res.status(400).json({
        success: false,
        message: 'This lead has no contact email address.',
      });
    }

    const defaultSubject = subject || `Following up: Website for ${lead.businessName}`;
    const defaultBody = body || `Hi ${lead.businessName},\n\nFollowing up on my previous message regarding a modern website for your business. Let me know if you'd be interested in discussing this further.\n\nBest regards,\n${req.user.name}`;

    const sendResult = await sendLeadEmail({
      userId: req.user._id,
      leadId: lead._id,
      recipient: lead.email,
      subject: defaultSubject,
      body: defaultBody,
      simulateIfNoGmail,
    });

    lead.emailStatus = 'FOLLOW_UP_SENT';
    if (nextDays > 0) {
      lead.nextFollowUpDate = new Date(Date.now() + nextDays * 24 * 60 * 60 * 1000);
    } else {
      lead.nextFollowUpDate = null;
    }

    lead.notes.push({
      content: `Follow-up email sent: "${defaultSubject}"`,
      createdBy: req.user.name,
      createdAt: new Date(),
    });

    await lead.save();

    return res.status(200).json({
      success: true,
      message: 'Follow-up email successfully sent.',
      data: sendResult,
      lead,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error sending follow-up',
    });
  }
};

// @desc    Reschedule a follow-up date
// @route   PUT /api/follow-ups/:leadId/reschedule
// @access  Private
const rescheduleFollowUp = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { followUpDate, days } = req.body;

    const lead = await Lead.findOne({ _id: leadId, userId: req.user._id });
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    let targetDate = null;
    if (followUpDate) {
      targetDate = new Date(followUpDate);
    } else if (days) {
      targetDate = new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000);
    }

    lead.nextFollowUpDate = targetDate;
    lead.notes.push({
      content: targetDate
        ? `Follow-up rescheduled to ${targetDate.toLocaleDateString()}`
        : 'Follow-up reminder cleared',
      createdBy: req.user.name,
      createdAt: new Date(),
    });

    await lead.save();

    return res.status(200).json({
      success: true,
      message: 'Follow-up rescheduled successfully.',
      data: lead,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error rescheduling follow-up',
    });
  }
};

module.exports = {
  getFollowUps,
  sendFollowUp,
  rescheduleFollowUp,
};


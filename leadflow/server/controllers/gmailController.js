const {
  getAuthUrl,
  handleOAuthCallback,
  disconnectGmail,
  getGmailStatus,
} = require('../services/gmailAuthService');
const { sendLeadEmail } = require('../services/gmailSendService');
const { Lead, User } = require('../models');

// @desc    Initiate Google OAuth flow
// @route   GET /api/gmail/auth
// @access  Private
const initiateAuth = async (req, res) => {
  try {
    const url = getAuthUrl(req.user._id);
    return res.status(200).json({
      success: true,
      authUrl: url,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error generating OAuth URL',
    });
  }
};

// @desc    OAuth Callback endpoint from Google
// @route   GET /api/gmail/callback
// @access  Public (State carries userId)
const oauthCallback = async (req, res) => {
  const { code, state: userId, error } = req.query;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  if (error) {
    return res.redirect(`${clientUrl}/settings?gmail=error&msg=${encodeURIComponent(error)}`);
  }

  if (!code || !userId) {
    return res.redirect(`${clientUrl}/settings?gmail=error&msg=Missing+code+or+state`);
  }

  try {
    await handleOAuthCallback(code, userId);
    return res.redirect(`${clientUrl}/settings?gmail=success`);
  } catch (err) {
    console.error('OAuth callback handling error:', err);
    return res.redirect(`${clientUrl}/settings?gmail=error&msg=${encodeURIComponent(err.message)}`);
  }
};

// @desc    Get Gmail connection status
// @route   GET /api/gmail/status
// @access  Private
const getStatus = async (req, res) => {
  try {
    const status = await getGmailStatus(req.user._id);
    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking Gmail status',
    });
  }
};

// @desc    Disconnect Gmail account
// @route   POST /api/gmail/disconnect
// @access  Private
const disconnect = async (req, res) => {
  try {
    await disconnectGmail(req.user._id);
    return res.status(200).json({
      success: true,
      message: 'Gmail account disconnected successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error disconnecting Gmail',
    });
  }
};

// @desc    Send email to lead
// @route   POST /api/gmail/send
// @access  Private
const sendEmail = async (req, res) => {
  try {
    const { leadId, recipient, subject, body, simulateIfNoGmail = false } = req.body;

    if (!leadId || !recipient || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Lead ID, recipient, subject, and body are required.',
      });
    }

    const result = await sendLeadEmail({
      userId: req.user._id,
      leadId,
      recipient,
      subject,
      body,
      simulateIfNoGmail,
    });

    return res.status(200).json({
      success: true,
      message: result.mode === 'SIMULATED' ? 'Email sent (Simulated mode)' : 'Email sent via Gmail API',
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Send bulk emails to multiple selected leads
// @route   POST /api/gmail/send-bulk
// @access  Private
const sendBulk = async (req, res) => {
  try {
    const { leadIds, subjectTemplate, bodyTemplate, simulateIfNoGmail = false } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of lead IDs to message.',
      });
    }

    if (!subjectTemplate || !bodyTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Subject and body templates are required.',
      });
    }

    const user = await User.findById(req.user._id);
    const leads = await Lead.find({
      _id: { $in: leadIds },
      userId: req.user._id,
      email: { $exists: true, $ne: '' },
    });

    if (leads.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'None of the selected leads have an email address.',
      });
    }

    const results = [];
    let sentCount = 0;
    let failCount = 0;

    for (const lead of leads) {
      // Check quota before each send
      const remainingQuota = user.dailyEmailLimit - user.emailsSentToday;
      if (remainingQuota <= 0) {
        results.push({
          leadId: lead._id,
          businessName: lead.businessName,
          status: 'SKIPPED',
          error: 'Daily email quota reached.',
        });
        continue;
      }

      // Variable interpolation
      const vars = {
        business_name: lead.businessName || 'Business',
        contact_name: lead.businessName,
        category: lead.category || 'Local Business',
        city: lead.city || 'your city',
        sender_name: user.name || 'Outreach Specialist',
      };

      const interpolatedSubject = subjectTemplate.replace(/{{\s*([\w_]+)\s*}}/g, (_, k) => vars[k] || '');
      const interpolatedBody = bodyTemplate.replace(/{{\s*([\w_]+)\s*}}/g, (_, k) => vars[k] || '');

      try {
        await sendLeadEmail({
          userId: user._id,
          leadId: lead._id,
          recipient: lead.email,
          subject: interpolatedSubject,
          body: interpolatedBody,
          simulateIfNoGmail,
        });

        sentCount++;
        results.push({
          leadId: lead._id,
          businessName: lead.businessName,
          recipient: lead.email,
          status: 'SUCCESS',
        });

        // Jitter delay between sends to mimic human behavior and respect quotas
        const delayMs = req.body.useJitter ? Math.floor(Math.random() * 1500) + 500 : 200;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } catch (err) {
        failCount++;
        results.push({
          leadId: lead._id,
          businessName: lead.businessName,
          recipient: lead.email,
          status: 'FAILED',
          error: err.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Bulk send complete. Sent: ${sentCount}, Failed/Skipped: ${failCount}`,
      summary: {
        totalRequested: leadIds.length,
        eligibleWithEmail: leads.length,
        sent: sentCount,
        failed: failCount,
      },
      results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error processing bulk email',
    });
  }
};

// @desc    Sync Gmail inbox and threads to automatically detect customer replies
// @route   POST /api/gmail/sync-replies
// @access  Private
const syncReplies = async (req, res) => {
  try {
    const userId = req.user._id;
    const authData = await require('../services/gmailAuthService').getAuthenticatedClient(userId);

    // Find leads currently contacted whose status is not yet REPLIED, CONVERTED, or ARCHIVED
    const activeLeads = await Lead.find({
      userId,
      emailStatus: { $in: ['SENT', 'FOLLOW_UP_SENT'] },
      leadStatus: { $nin: ['REPLIED', 'CONVERTED', 'ARCHIVED'] },
      email: { $exists: true, $ne: '' },
    }).limit(50);

    let updatedCount = 0;
    const detectedReplies = [];

    if (authData) {
      const { google } = require('googleapis');
      const gmail = google.gmail({ version: 'v1', auth: authData.client });

      for (const lead of activeLeads) {
        try {
          // Search Gmail messages from this lead
          const query = `from:${lead.email.trim()}`;
          const searchRes = await gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults: 5,
          });

          if (searchRes.data.messages && searchRes.data.messages.length > 0) {
            lead.leadStatus = 'REPLIED';
            lead.nextFollowUpDate = null; // Stop further cold follow-ups
            lead.notes.push({
              content: `Automated Sync: Detected inbound reply from ${lead.email} in Gmail!`,
              createdBy: 'Gmail Reply Detector',
              createdAt: new Date(),
            });
            await lead.save();

            updatedCount++;
            detectedReplies.push({
              leadId: lead._id,
              businessName: lead.businessName,
              email: lead.email,
            });
          }
        } catch (threadErr) {
          console.warn(`Thread check error for ${lead.email}:`, threadErr.message);
        }
      }
    } else {
      // In dev/demo mode, if simulate param is passed, simulate reply detection on first contacted lead
      if (req.body.simulate && activeLeads.length > 0) {
        const lead = activeLeads[0];
        lead.leadStatus = 'REPLIED';
        lead.nextFollowUpDate = null;
        lead.notes.push({
          content: `Simulated Reply: Customer replied expressing interest in website proposal!`,
          createdBy: 'System (Dev Mode)',
          createdAt: new Date(),
        });
        await lead.save();
        updatedCount++;
        detectedReplies.push({
          leadId: lead._id,
          businessName: lead.businessName,
          email: lead.email,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Reply synchronization completed. Detected ${updatedCount} new replies.`,
      updatedCount,
      replies: detectedReplies,
    });
  } catch (error) {
    console.error('Sync replies error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error syncing replies from Gmail',
    });
  }
};

module.exports = {
  initiateAuth,
  oauthCallback,
  getStatus,
  disconnect,
  sendEmail,
  sendBulk,
  syncReplies,
};


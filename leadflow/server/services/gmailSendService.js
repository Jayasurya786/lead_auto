const { google } = require('googleapis');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { getAuthenticatedClient } = require('./gmailAuthService');
const { Lead, EmailMessage, User } = require('../models');
const { verifyMxRecords } = require('./dnsService');

/**
 * Returns a configured Nodemailer SMTP transporter if SMTP credentials are provided
 */
const getSmtpTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user: user.trim(),
      pass: pass.replace(/\s+/g, ''),
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Injects 1x1 tracking pixel and wraps links for click tracking
 */
const injectTracking = (bodyHtml, messageId) => {
  const host = process.env.CLIENT_URL || 'http://localhost:5173';
  // If backend is on 5000 and client on 5173, point tracking to backend port or client proxy
  const trackingHost = process.env.SERVER_URL || 'http://localhost:5000';

  // Append 1x1 invisible open tracking image
  const trackingPixel = `<br/><img src="${trackingHost}/api/tracking/open/${messageId}" width="1" height="1" alt="" style="display:none !important;" />`;

  // Wrap links with click tracking
  const wrappedHtml = bodyHtml.replace(
    /href="(https?:\/\/[^"]+)"/gi,
    (match, url) => `href="${trackingHost}/api/tracking/click/${messageId}?url=${encodeURIComponent(url)}"`
  );

  return `${wrappedHtml}${trackingPixel}`;
};

/**
 * Creates RFC 2822 compliant email string and encodes to URL-safe Base64
 */
const makeRawEmail = ({ to, from, subject, body, messageId }) => {
  // Convert plain newlines to HTML paragraphs/breaks if not already HTML
  const isHtml = /<[a-z][\s\S]*>/i.test(body);
  const baseHtml = isHtml ? body : body.replace(/\n/g, '<br/>');

  // Inject tracking pixel and click wrappers
  const finalHtml = messageId ? injectTracking(baseHtml, messageId) : baseHtml;

  const str = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    `<div>${finalHtml}</div>`,
  ].join('\r\n');

  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Check and increment user daily quota
 */
const checkAndIncrementDailyQuota = async (user) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const lastDateStr = user.lastSentDate ? new Date(user.lastSentDate).toISOString().split('T')[0] : null;

  if (todayStr !== lastDateStr) {
    user.emailsSentToday = 0;
    user.lastSentDate = now;
  }

  const limit = user.dailyEmailLimit || 50;
  if (user.emailsSentToday >= limit) {
    throw new Error(
      `Daily outreach limit reached (${user.emailsSentToday}/${limit}). You can update your daily limit in Settings or try again tomorrow.`
    );
  }

  user.emailsSentToday += 1;
  await user.save();
};

/**
 * Send an outreach email to a lead
 */
const sendLeadEmail = async ({ userId, leadId, recipient, subject, body, simulateIfNoGmail = false }) => {
  if (!recipient || !recipient.includes('@')) {
    throw new Error('A valid recipient email address is required.');
  }

  // 1. DNS MX Record Deliverability Pre-Check
  const mxCheck = await verifyMxRecords(recipient);
  if (!mxCheck.valid) {
    throw new Error(`Email deliverability check failed: ${mxCheck.reason}. Email not sent to protect sender reputation.`);
  }

  const lead = await Lead.findOne({ _id: leadId, userId });
  if (!lead) {
    throw new Error('Lead not found.');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  // Check daily limit
  await checkAndIncrementDailyQuota(user);

  // 1. Direct SMTP transport (Zero Google Cloud / Zero OAuth keys needed)
  const smtpTransporter = getSmtpTransporter();
  if (smtpTransporter) {
    try {
      const emailObjectId = new mongoose.Types.ObjectId();
      const isHtml = /<[a-z][\s\S]*>/i.test(body);
      const baseHtml = isHtml ? body : body.replace(/\n/g, '<br/>');
      const htmlWithTracking = injectTracking(baseHtml, emailObjectId.toString());

      const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
      const info = await smtpTransporter.sendMail({
        from: `"${user.name || 'LeadFlow Outreach'}" <${fromAddress}>`,
        to: recipient.toLowerCase().trim(),
        subject,
        html: htmlWithTracking,
      });

      const messageId = info.messageId || `smtp_${Date.now()}`;

      const emailMsg = await EmailMessage.create({
        _id: emailObjectId,
        userId,
        leadId,
        recipient: recipient.toLowerCase().trim(),
        subject,
        body,
        messageId,
        threadId: `thread_${messageId}`,
        status: 'SENT',
        sentAt: new Date(),
      });

      lead.emailStatus = 'SENT';
      lead.leadStatus = lead.leadStatus === 'NEW' ? 'CONTACTED' : lead.leadStatus;
      lead.lastContactedAt = new Date();
      lead.nextFollowUpDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      lead.notes.push({
        content: `Outreach email sent via Direct SMTP: "${subject}" to ${recipient}`,
        createdBy: user.name || 'User',
        createdAt: new Date(),
      });
      await lead.save();

      return {
        success: true,
        mode: 'SMTP',
        messageId,
        emailMessage: emailMsg,
      };
    } catch (smtpErr) {
      console.error('SMTP sending error:', smtpErr);
      throw new Error(`Failed to send email via SMTP: ${smtpErr.message}`);
    }
  }

  const authData = await getAuthenticatedClient(userId);

  // If no Gmail account connected
  if (!authData) {
    if (simulateIfNoGmail) {
      // Development simulation mode
      const simObjectId = new mongoose.Types.ObjectId();
      const simMessageId = `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const emailMsg = await EmailMessage.create({
        _id: simObjectId,
        userId,
        leadId,
        recipient: recipient.toLowerCase().trim(),
        subject,
        body,
        messageId: simMessageId,
        threadId: `thread_${simMessageId}`,
        status: 'SIMULATED',
        sentAt: new Date(),
      });

      lead.emailStatus = 'SENT';
      lead.leadStatus = lead.leadStatus === 'NEW' ? 'CONTACTED' : lead.leadStatus;
      lead.lastContactedAt = new Date();
      lead.nextFollowUpDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days follow-up
      lead.notes.push({
        content: `Simulated outreach email sent: "${subject}" to ${recipient}`,
        createdBy: 'System (Dev Mode)',
        createdAt: new Date(),
      });
      await lead.save();

      return {
        success: true,
        mode: 'SIMULATED',
        messageId: simMessageId,
        emailMessage: emailMsg,
        note: 'Simulated email send. Connect your Gmail account in Settings for live sending.',
      };
    } else {
      throw new Error(
        'Gmail is not connected. Please go to Settings > Gmail Integration to connect your Google account before sending emails.'
      );
    }
  }

  // Live Gmail API sending
  try {
    const { client, email: senderEmail } = authData;
    const gmail = google.gmail({ version: 'v1', auth: client });

    const emailObjectId = new mongoose.Types.ObjectId();

    const raw = makeRawEmail({
      to: recipient.toLowerCase().trim(),
      from: senderEmail,
      subject,
      body,
      messageId: emailObjectId.toString(),
    });

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });

    const messageId = response.data.id;
    const threadId = response.data.threadId;

    const emailMsg = await EmailMessage.create({
      _id: emailObjectId,
      userId,
      leadId,
      recipient: recipient.toLowerCase().trim(),
      subject,
      body,
      messageId,
      threadId,
      status: 'SENT',
      sentAt: new Date(),
    });

    lead.emailStatus = 'SENT';
    lead.leadStatus = lead.leadStatus === 'NEW' ? 'CONTACTED' : lead.leadStatus;
    lead.lastContactedAt = new Date();
    lead.nextFollowUpDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days default follow-up
    lead.notes.push({
      content: `Outreach email sent via Gmail: "${subject}" to ${recipient}`,
      createdBy: user.name || 'User',
      createdAt: new Date(),
    });
    await lead.save();

    return {
      success: true,
      mode: 'LIVE',
      messageId,
      threadId,
      emailMessage: emailMsg,
    };
  } catch (err) {
    console.error('Gmail send error:', err.message);

    // Record failed status
    lead.emailStatus = 'FAILED';
    await lead.save();

    await EmailMessage.create({
      userId,
      leadId,
      recipient: recipient.toLowerCase().trim(),
      subject,
      body,
      status: 'FAILED',
      error: err.message.replace(/([a-zA-Z0-9_\-\.]{30,})/g, '[REDACTED]'), // Mask any potential token fragments
      sentAt: new Date(),
    });

    throw new Error(`Failed to send email through Gmail: ${err.message}`);
  }
};

module.exports = {
  makeRawEmail,
  sendLeadEmail,
  checkAndIncrementDailyQuota,
};


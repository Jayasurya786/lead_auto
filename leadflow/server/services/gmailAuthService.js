const { google } = require('googleapis');
const { GmailAccount } = require('../models');
const { encrypt, decrypt } = require('./encryptionService');

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
];

const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/gmail/callback';

  if (!clientId || !clientSecret) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

/**
 * Generate Google OAuth 2.0 authorization URL
 */
const getAuthUrl = (userId) => {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are not configured.');
  }

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: userId.toString(),
  });
};

/**
 * Handle OAuth callback: exchange code, fetch email, encrypt tokens, store in DB
 */
const handleOAuthCallback = async (code, userId) => {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    throw new Error('Google OAuth is not configured on the server.');
  }

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Fetch authenticated Google user's email address
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  const email = userInfo.data.email;

  if (!email) {
    throw new Error('Unable to retrieve email address from Google OAuth profile.');
  }

  // Encrypt tokens object
  const { encryptedData, iv, authTag } = encrypt(JSON.stringify(tokens));

  // Upsert GmailAccount for this user
  const account = await GmailAccount.findOneAndUpdate(
    { userId },
    {
      userId,
      email,
      encryptedTokens: encryptedData,
      iv,
      authTag,
      scope: tokens.scope || SCOPES.join(' '),
      connectedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return { email: account.email };
};

/**
 * Returns authenticated OAuth2Client for a user, or null if not connected
 */
const getAuthenticatedClient = async (userId) => {
  const account = await GmailAccount.findOne({ userId });
  if (!account) return null;

  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) return null;

  try {
    const decryptedJson = decrypt(account.encryptedTokens, account.iv, account.authTag);
    const tokens = JSON.parse(decryptedJson);

    oauth2Client.setCredentials(tokens);

    // Listen for refreshed tokens and save them back encrypted
    oauth2Client.on('tokens', async (newTokens) => {
      const merged = { ...tokens, ...newTokens };
      const { encryptedData, iv, authTag } = encrypt(JSON.stringify(merged));
      await GmailAccount.updateOne(
        { userId },
        { encryptedTokens: encryptedData, iv, authTag }
      );
    });

    return { client: oauth2Client, email: account.email };
  } catch (err) {
    console.error('Error decrypting stored Gmail credentials:', err.message);
    return null;
  }
};

/**
 * Disconnect and remove Gmail credentials for a user
 */
const disconnectGmail = async (userId) => {
  await GmailAccount.deleteOne({ userId });
  return true;
};

/**
 * Get Gmail connection status
 */
const getGmailStatus = async (userId) => {
  const account = await GmailAccount.findOne({ userId }).select('email connectedAt');
  const hasSmtp = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
  const hasGoogleConfig = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  if (hasSmtp) {
    return {
      connected: true,
      configured: true,
      provider: 'SMTP',
      email: process.env.SMTP_FROM || process.env.SMTP_USER,
      connectedAt: new Date(),
    };
  }

  if (!account) {
    return {
      connected: false,
      configured: hasGoogleConfig,
      provider: 'SIMULATION',
      email: null,
    };
  }

  return {
    connected: true,
    configured: hasGoogleConfig,
    provider: 'GOOGLE_OAUTH',
    email: account.email,
    connectedAt: account.connectedAt,
  };
};

module.exports = {
  getOAuth2Client,
  getAuthUrl,
  handleOAuthCallback,
  getAuthenticatedClient,
  disconnectGmail,
  getGmailStatus,
};


const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

// Derive 32-byte key from ENCRYPTION_KEY or a secure fallback
const getKey = () => {
  const secret = process.env.ENCRYPTION_KEY || 'leadflow_secure_default_encryption_key_32bytes!';
  return crypto.createHash('sha256').update(String(secret)).digest();
};

/**
 * Encrypts plaintext string using AES-256-GCM.
 */
const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag,
  };
};

/**
 * Decrypts AES-256-GCM encrypted string.
 */
const decrypt = (encryptedData, ivHex, authTagHex) => {
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

module.exports = {
  encrypt,
  decrypt,
};


const dns = require('dns').promises;

/**
 * Validates whether an email address has a valid domain with active MX records.
 * Uses native Node.js DNS resolution without external paid services.
 */
const verifyMxRecords = async (email) => {
  if (!email || !email.includes('@')) {
    return { valid: false, reason: 'Malformed email syntax' };
  }

  const domain = email.split('@')[1].trim().toLowerCase();

  // Local/test domain pass-through
  if (domain.endsWith('.local') || domain === 'localhost' || domain === 'test.com' || domain === 'example.com') {
    return { valid: true, mxRecords: ['local-test-mx'] };
  }

  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) {
      return { valid: false, reason: `No MX records found for domain: ${domain}` };
    }
    return { valid: true, mxRecords: records };
  } catch (err) {
    // If ENOTFOUND, ENODATA, or NXDOMAIN, domain cannot receive emails
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.code === 'SERVFAIL') {
      return { valid: false, reason: `Domain ${domain} does not have mail exchangers (${err.code})` };
    }
    // For timeouts or network issues, allow soft-pass to not block legitimate sends
    return { valid: true, warning: `DNS check warning: ${err.message}` };
  }
};

module.exports = {
  verifyMxRecords,
};


/**
 * Normalization utilities for LeadFlow deduplication and data cleaning.
 */

// Normalize business name: lowercase, strip punctuation and extra spaces
const normalizeBusinessName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/[^\w\s]/gi, '') // Remove non-alphanumeric chars
    .replace(/\s+/g, ' ')     // Collapse multiple spaces
    .trim();
};

// Normalize phone: keep digits only (handles (555) 123-4567, +1-555-123-4567, etc.)
const normalizePhone = (phone) => {
  if (!phone) return '';
  const str = String(phone).trim();
  // Strip everything except digits
  const digits = str.replace(/\D/g, '');
  // If starts with country code like 1 for US or 91 for India, can keep digits
  return digits;
};

// Normalize email: trim and lowercase
const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

// Check if a URL is actually a Google Maps URL rather than a business website
const isGoogleMapsUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase().trim();
  return (
    lower.includes('maps.google.') ||
    lower.includes('google.com/maps') ||
    lower.includes('goo.gl/maps') ||
    lower.includes('maps.app.goo.gl') ||
    lower.includes('google.co/maps')
  );
};

// List of text tokens indicating NO website
const NO_WEBSITE_TOKENS = new Set([
  '',
  '-',
  '--',
  '---',
  'n/a',
  'na',
  'none',
  'not available',
  'not-available',
  'not_available',
  'no',
  'null',
  'nil',
  'undefined',
  '#n/a',
  'no website',
  'no-website',
  'false',
  '0',
]);

// Determine if a website field represents "NO WEBSITE"
const isWebsiteEmpty = (val) => {
  if (val === null || val === undefined) return true;
  const str = String(val).trim().toLowerCase();
  if (NO_WEBSITE_TOKENS.has(str)) return true;

  // A Google Maps URL must NOT be treated as a business website
  if (isGoogleMapsUrl(str)) return true;

  return false;
};

// Normalize a genuine website URL
const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  let str = url.trim();
  if (isWebsiteEmpty(str)) return '';

  // Add https if missing scheme
  if (!/^https?:\/\//i.test(str)) {
    str = 'https://' + str;
  }

  // Remove trailing slash
  return str.replace(/\/+$/, '');
};

module.exports = {
  normalizeBusinessName,
  normalizePhone,
  normalizeEmail,
  isGoogleMapsUrl,
  isWebsiteEmpty,
  normalizeUrl,
};


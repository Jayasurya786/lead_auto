const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const {
  normalizeBusinessName,
  normalizePhone,
  normalizeEmail,
  isGoogleMapsUrl,
  isWebsiteEmpty,
  normalizeUrl,
} = require('../utils/normalizers');

const { parseSpreadsheetBuffer } = require('../services/xlsxParserService');
const { filterWebsiteStatus } = require('../services/websiteFilterService');

describe('1. Normalization Utilities', () => {
  it('should normalize business names by removing punctuation and extra whitespace', () => {
    assert.strictEqual(normalizeBusinessName('  ABC   SALON  '), 'abc salon');
    assert.strictEqual(normalizeBusinessName('ABC Salon, Inc.'), 'abc salon inc');
    assert.strictEqual(normalizeBusinessName('Dr. John Smith & Co.'), 'dr john smith co');
  });

  it('should normalize phone numbers to digits only', () => {
    assert.strictEqual(normalizePhone('(512) 555-0199'), '5125550199');
    assert.strictEqual(normalizePhone('+1-512-555-0188'), '15125550188');
    assert.strictEqual(normalizePhone('512.555.0142'), '5125550142');
  });

  it('should normalize email to trimmed lowercase', () => {
    assert.strictEqual(normalizeEmail('  Contact@AustinSalon.COM '), 'contact@austinsalon.com');
  });

  it('should identify Google Maps URLs and reject them as business websites', () => {
    assert.strictEqual(isGoogleMapsUrl('https://maps.google.com/?cid=1001'), true);
    assert.strictEqual(isGoogleMapsUrl('https://www.google.com/maps/place/Salon'), true);
    assert.strictEqual(isGoogleMapsUrl('https://maps.app.goo.gl/xyz123'), true);
    assert.strictEqual(isGoogleMapsUrl('https://goo.gl/maps/abc'), true);
    assert.strictEqual(isGoogleMapsUrl('https://www.austinsalon.com'), false);
  });

  it('should accurately recognize empty, null, N/A, and Google Maps URLs as NO_WEBSITE', () => {
    assert.strictEqual(isWebsiteEmpty(''), true);
    assert.strictEqual(isWebsiteEmpty('   '), true);
    assert.strictEqual(isWebsiteEmpty(null), true);
    assert.strictEqual(isWebsiteEmpty(undefined), true);
    assert.strictEqual(isWebsiteEmpty('-'), true);
    assert.strictEqual(isWebsiteEmpty('N/A'), true);
    assert.strictEqual(isWebsiteEmpty('na'), true);
    assert.strictEqual(isWebsiteEmpty('none'), true);
    assert.strictEqual(isWebsiteEmpty('not available'), true);
    assert.strictEqual(isWebsiteEmpty('https://maps.google.com/maps?cid=123'), true); // Google Maps URL is NOT website!

    assert.strictEqual(isWebsiteEmpty('https://austinsalon.com'), false);
    assert.strictEqual(isWebsiteEmpty('austinsalon.com'), false);
  });

  it('should normalize genuine URLs with https and remove trailing slashes', () => {
    assert.strictEqual(normalizeUrl('austinsalon.com/'), 'https://austinsalon.com');
    assert.strictEqual(normalizeUrl('http://austinsalon.com///'), 'http://austinsalon.com');
    assert.strictEqual(normalizeUrl('N/A'), '');
  });
});

describe('2. Website Filtering Engine', () => {
  it('should classify genuine website as HAS_WEBSITE and not a lead candidate', () => {
    const result = filterWebsiteStatus({
      businessName: 'Apex Dental',
      website: 'https://www.apexdental.com',
      mapsUrl: '',
    });
    assert.strictEqual(result.websiteStatus, 'HAS_WEBSITE');
    assert.strictEqual(result.isLeadCandidate, false);
    assert.strictEqual(result.website, 'https://www.apexdental.com');
  });

  it('should classify empty website as NO_WEBSITE and qualify as lead', () => {
    const result = filterWebsiteStatus({
      businessName: 'Glow Salon',
      website: '',
      mapsUrl: 'https://maps.google.com/?cid=1002',
    });
    assert.strictEqual(result.websiteStatus, 'NO_WEBSITE');
    assert.strictEqual(result.isLeadCandidate, true);
    assert.strictEqual(result.website, '');
  });

  it('should classify Google Maps URL placed in website column as NO_WEBSITE and move to mapsUrl', () => {
    const result = filterWebsiteStatus({
      businessName: 'Blue Wave Plumbing',
      website: 'https://maps.google.com/maps?cid=55443322',
      mapsUrl: '',
    });
    assert.strictEqual(result.websiteStatus, 'NO_WEBSITE');
    assert.strictEqual(result.isLeadCandidate, true);
    assert.strictEqual(result.website, '');
    assert.strictEqual(result.mapsUrl, 'https://maps.google.com/maps?cid=55443322');
  });
});

describe('3. Spreadsheet Ingestion & Column Mapping', () => {
  it('should parse sample XLSX file and normalize all headers accurately', () => {
    const filePath = path.join(__dirname, '../../sample_data/sample_businesses.xlsx');
    const buffer = fs.readFileSync(filePath);
    const rows = parseSpreadsheetBuffer(buffer);

    assert.strictEqual(rows.length, 10);
    assert.strictEqual(rows[0].businessName, 'Metro Apex Dental Care');
    assert.strictEqual(rows[0].category, 'Dentist');
    assert.strictEqual(rows[0].city, 'Austin');
    assert.strictEqual(rows[0].phone, '(512) 555-0142');
    assert.strictEqual(rows[0].website, 'https://www.metroapexdental.com');
  });
});

describe('4. Free Enhancements: DNS MX Check & AI Pitch Service', () => {
  const { verifyMxRecords } = require('../services/dnsService');
  const { generateAiPitch } = require('../services/geminiService');

  it('should validate test domains without error', async () => {
    const res = await verifyMxRecords('test@example.com');
    assert.strictEqual(res.valid, true);
  });

  it('should reject malformed email syntax', async () => {
    const res = await verifyMxRecords('invalid-email-address');
    assert.strictEqual(res.valid, false);
  });

  it('should generate personalized outreach pitch with smart heuristic fallback', async () => {
    const pitch = await generateAiPitch({
      businessName: 'Austin Glow Hair Salon',
      category: 'Hair Salon',
      city: 'Austin',
      rating: 4.9,
      reviews: 88,
      senderName: 'Alex',
    });

    assert.strictEqual(pitch.success, true);
    assert.ok(pitch.subject.includes('Austin Glow Hair Salon'));
    assert.ok(pitch.body.includes('4.9-star') || pitch.body.includes('Austin Glow Hair Salon'));
  });
});


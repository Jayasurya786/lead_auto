const { isWebsiteEmpty, isGoogleMapsUrl, normalizeUrl } = require('../utils/normalizers');

/**
 * Analyzes and classifies the website status of an imported business.
 * Ensures Google Maps URLs are never counted as business websites.
 */
const filterWebsiteStatus = (business) => {
  let rawWebsite = business.website ? String(business.website).trim() : '';
  let rawMapsUrl = business.mapsUrl ? String(business.mapsUrl).trim() : '';

  // If website value is actually a Google Maps URL, shift it to mapsUrl
  if (isGoogleMapsUrl(rawWebsite)) {
    if (!rawMapsUrl) {
      rawMapsUrl = rawWebsite;
    }
    rawWebsite = '';
  }

  // Check if website is empty or matches NO_WEBSITE tokens
  const noWebsite = isWebsiteEmpty(rawWebsite);

  let websiteStatus = 'NO_WEBSITE';
  let cleanWebsite = '';

  if (!noWebsite) {
    websiteStatus = 'HAS_WEBSITE';
    cleanWebsite = normalizeUrl(rawWebsite);
  }

  return {
    websiteStatus,
    website: cleanWebsite,
    mapsUrl: rawMapsUrl,
    isLeadCandidate: websiteStatus === 'NO_WEBSITE',
  };
};

module.exports = {
  filterWebsiteStatus,
};


const { Lead } = require('../models');
const {
  normalizeBusinessName,
  normalizePhone,
  normalizeEmail,
} = require('../utils/normalizers');

/**
 * Checks whether a candidate lead already exists for this user in MongoDB or in the current batch.
 */
class DuplicateDetector {
  constructor(userId) {
    this.userId = userId;
    // In-memory sets to catch duplicates within the same batch upload
    this.batchEmails = new Set();
    this.batchPhones = new Set();
    this.batchNameCities = new Set();
  }

  /**
   * Evaluates candidate lead against DB records and the current batch.
   * Returns { isDuplicate: boolean, reason: string | null }
   */
  async checkDuplicate(leadData) {
    const normName = normalizeBusinessName(leadData.businessName);
    const normPhone = normalizePhone(leadData.phone);
    const normEmail = normalizeEmail(leadData.email);
    const normCity = leadData.city ? leadData.city.trim().toLowerCase() : '';

    // 1. Check in-batch duplicates
    if (normEmail && this.batchEmails.has(normEmail)) {
      return { isDuplicate: true, reason: 'Duplicate email in current file' };
    }
    if (normPhone && normPhone.length >= 7 && this.batchPhones.has(normPhone)) {
      return { isDuplicate: true, reason: 'Duplicate phone in current file' };
    }
    const nameCityKey = `${normName}|${normCity}`;
    if (normName && this.batchNameCities.has(nameCityKey)) {
      return { isDuplicate: true, reason: 'Duplicate business name and city in current file' };
    }

    // 2. Query MongoDB for existing records belonging to this user
    const orConditions = [];

    if (normEmail) {
      orConditions.push({ normalizedEmail: normEmail });
    }
    if (normPhone && normPhone.length >= 7) {
      orConditions.push({ normalizedPhone: normPhone });
    }
    if (normName && normCity) {
      orConditions.push({ normalizedBusinessName: normName, city: new RegExp(`^${normCity}$`, 'i') });
    } else if (normName) {
      // If city is absent, match by exact normalized name
      orConditions.push({ normalizedBusinessName: normName });
    }

    if (orConditions.length > 0) {
      const existing = await Lead.findOne({
        userId: this.userId,
        $or: orConditions,
      }).select('_id businessName email phone');

      if (existing) {
        return {
          isDuplicate: true,
          reason: `Matches existing lead: ${existing.businessName} (ID: ${existing._id})`,
        };
      }
    }

    // Register into in-batch sets for subsequent rows
    if (normEmail) this.batchEmails.add(normEmail);
    if (normPhone && normPhone.length >= 7) this.batchPhones.add(normPhone);
    if (normName) this.batchNameCities.add(nameCityKey);

    return { isDuplicate: false, reason: null };
  }
}

module.exports = DuplicateDetector;


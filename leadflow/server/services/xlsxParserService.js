const xlsx = require('xlsx');

// Canonical mapping dictionaries with regex patterns to identify headers
const COLUMN_MAPPINGS = {
  businessName: /^(business[_\s]?name|company[_\s]?name|company|business|name|title|store[_\s]?name)$/i,
  category: /^(category|type|industry|business[_\s]?type|niche)$/i,
  address: /^(address|street|street[_\s]?address|location|full[_\s]?address)$/i,
  city: /^(city|town|locality)$/i,
  state: /^(state|province|region)$/i,
  country: /^(country|nation)$/i,
  phone: /^(phone|phone[_\s]?number|tel|telephone|mobile|contact[_\s]?number|cell)$/i,
  email: /^(email|email[_\s]?address|contact[_\s]?email|e-mail)$/i,
  website: /^(website|website[_\s]?url|web|url|site|domain|homepage)$/i,
  mapsUrl: /^(google[_\s]?maps|google[_\s]?maps[_\s]?url|maps[_\s]?url|map[_\s]?link|gmaps)$/i,
  rating: /^(rating|stars|score|rate)$/i,
  reviews: /^(reviews|review[_\s]?count|total[_\s]?reviews|ratings[_\s]?count|number[_\s]?of[_\s]?reviews)$/i,
};

/**
 * Parses spreadsheet buffer safely without formula/macro execution.
 * Maps columns flexibly to canonical fields while preserving extra columns.
 */
const parseSpreadsheetBuffer = (buffer) => {
  if (!buffer || buffer.length === 0) {
    throw new Error('Spreadsheet file is empty.');
  }

  // Disable formula evaluation and HTML parsing for security
  const workbook = xlsx.read(buffer, {
    type: 'buffer',
    cellFormula: false,
    cellHTML: false,
    cellText: true,
  });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Spreadsheet contains no sheets.');
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  if (!worksheet) {
    throw new Error('Unable to read worksheet data.');
  }

  // Convert worksheet to JSON rows with headers
  const rawRows = xlsx.utils.sheet_to_json(worksheet, {
    raw: false,
    defval: '',
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Spreadsheet contains no data rows.');
  }

  // Detect header mapping from first row keys
  const headers = Object.keys(rawRows[0]);
  const headerMap = {};

  headers.forEach((header) => {
    const cleanHeader = header.trim();
    let matched = false;

    for (const [canonicalField, pattern] of Object.entries(COLUMN_MAPPINGS)) {
      if (pattern.test(cleanHeader)) {
        headerMap[cleanHeader] = canonicalField;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Unmapped columns will be collected into rawDetails
      headerMap[cleanHeader] = null;
    }
  });

  // Map each row to structured business object
  const normalizedRows = rawRows.map((row, index) => {
    const business = {
      businessName: '',
      category: '',
      address: '',
      city: '',
      state: '',
      country: '',
      phone: '',
      email: '',
      website: '',
      mapsUrl: '',
      rating: null,
      reviews: null,
      rawDetails: {},
    };

    Object.entries(row).forEach(([header, val]) => {
      const cleanHeader = header.trim();
      const canonicalField = headerMap[cleanHeader];
      const stringVal = typeof val === 'string' ? val.trim() : (val !== null && val !== undefined ? String(val).trim() : '');

      if (canonicalField) {
        if (canonicalField === 'rating' || canonicalField === 'reviews') {
          const num = parseFloat(stringVal);
          business[canonicalField] = !isNaN(num) ? num : null;
        } else {
          // If the field is already populated and we encounter another mapped header, prefer non-empty
          if (!business[canonicalField] || stringVal) {
            business[canonicalField] = stringVal;
          }
        }
      } else {
        if (stringVal) {
          business.rawDetails[cleanHeader] = stringVal;
        }
      }
    });

    // Fallback: if businessName is still empty, look for any non-empty cell in row or label Row #
    if (!business.businessName) {
      business.businessName = `Business Row #${index + 1}`;
    }

    return business;
  });

  return normalizedRows;
};

module.exports = {
  parseSpreadsheetBuffer,
};


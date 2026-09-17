const { parseSpreadsheetBuffer } = require('../services/xlsxParserService');
const { filterWebsiteStatus } = require('../services/websiteFilterService');
const DuplicateDetector = require('../services/duplicateDetectionService');
const { Import, Business, Lead, Contact } = require('../models');
const {
  normalizeBusinessName,
  normalizePhone,
  normalizeEmail,
} = require('../utils/normalizers');

// @desc    Upload and process spreadsheet
// @route   POST /api/imports
// @access  Private
const uploadSpreadsheet = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a spreadsheet file (.xlsx, .xls, or .csv).',
    });
  }

  let importRecord = null;

  try {
    const rawRows = parseSpreadsheetBuffer(req.file.buffer);

    importRecord = await Import.create({
      userId: req.user._id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      totalRows: rawRows.length,
      status: 'PROCESSING',
    });

    let websitesFoundCount = 0;
    let noWebsiteCount = 0;
    let duplicateCount = 0;
    let newLeadsCount = 0;

    const duplicateDetector = new DuplicateDetector(req.user._id);

    // Process rows sequentially to maintain transaction integrity and batch deduplication
    for (const row of rawRows) {
      const { websiteStatus, website, mapsUrl, isLeadCandidate } = filterWebsiteStatus(row);

      const normName = normalizeBusinessName(row.businessName);
      const normPhone = normalizePhone(row.phone);
      const normEmail = normalizeEmail(row.email);

      // Record business in general Business collection
      const businessDoc = await Business.create({
        userId: req.user._id,
        importId: importRecord._id,
        businessName: row.businessName,
        normalizedBusinessName: normName,
        category: row.category,
        address: row.address,
        city: row.city,
        state: row.state,
        country: row.country,
        phone: row.phone,
        normalizedPhone: normPhone,
        email: row.email,
        normalizedEmail: normEmail,
        website: website,
        mapsUrl: mapsUrl,
        rating: row.rating,
        reviews: row.reviews,
        websiteStatus: websiteStatus,
        rawDetails: row.rawDetails,
      });

      if (!isLeadCandidate) {
        websitesFoundCount++;
      } else {
        noWebsiteCount++;

        // Duplicate check
        const dupCheck = await duplicateDetector.checkDuplicate({
          businessName: row.businessName,
          phone: row.phone,
          email: row.email,
          city: row.city,
        });

        if (dupCheck.isDuplicate) {
          duplicateCount++;
        } else {
          newLeadsCount++;

          const leadDoc = await Lead.create({
            userId: req.user._id,
            businessId: businessDoc._id,
            importId: importRecord._id,
            businessName: row.businessName,
            normalizedBusinessName: normName,
            category: row.category,
            address: row.address,
            city: row.city,
            state: row.state,
            country: row.country,
            phone: row.phone,
            normalizedPhone: normPhone,
            email: row.email,
            normalizedEmail: normEmail,
            website: '',
            mapsUrl: mapsUrl,
            rating: row.rating,
            reviews: row.reviews,
            websiteStatus: 'NO_WEBSITE',
            leadStatus: 'NEW',
            emailStatus: 'NOT_SENT',
            source: req.file.originalname,
            notes: [
              {
                content: `Lead created from import: ${req.file.originalname}`,
                createdBy: 'LeadFlow Import Engine',
                createdAt: new Date(),
              },
            ],
          });

          // If email or contact person is present in imported row, create primary Contact
          if (row.email || row.phone) {
            await Contact.create({
              userId: req.user._id,
              leadId: leadDoc._id,
              name: row.businessName ? `${row.businessName} Contact` : 'Primary Contact',
              email: row.email || '',
              phone: row.phone || '',
              source: 'Import',
              isPrimary: true,
              verified: false,
            });
          }
        }
      }
    }

    // Update Import record with final stats
    importRecord.totalRows = rawRows.length;
    importRecord.websitesFound = websitesFoundCount;
    importRecord.noWebsite = noWebsiteCount;
    importRecord.duplicates = duplicateCount;
    importRecord.newLeads = newLeadsCount;
    importRecord.status = 'COMPLETED';
    await importRecord.save();

    return res.status(200).json({
      success: true,
      message: 'Import processed successfully.',
      importId: importRecord._id,
      stats: {
        fileName: req.file.originalname,
        totalRows: rawRows.length,
        websitesFound: websitesFoundCount,
        noWebsite: noWebsiteCount,
        duplicates: duplicateCount,
        newLeads: newLeadsCount,
      },
    });
  } catch (error) {
    console.error('Import processing error:', error);
    if (importRecord) {
      importRecord.status = 'FAILED';
      importRecord.errorMessage = error.message;
      await importRecord.save();
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Error processing spreadsheet upload',
    });
  }
};

// @desc    Get import history for user
// @route   GET /api/imports
// @access  Private
const getImports = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [imports, total] = await Promise.all([
      Import.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Import.countDocuments({ userId: req.user._id }),
    ]);

    return res.status(200).json({
      success: true,
      count: imports.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: imports,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching imports',
    });
  }
};

// @desc    Get single import details
// @route   GET /api/imports/:id
// @access  Private
const getImportById = async (req, res) => {
  try {
    const importItem = await Import.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!importItem) {
      return res.status(404).json({
        success: false,
        message: 'Import not found',
      });
    }

    // Fetch leads generated by this import
    const leads = await Lead.find({
      importId: importItem._id,
      userId: req.user._id,
    }).limit(100);

    return res.status(200).json({
      success: true,
      data: importItem,
      sampleLeads: leads,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching import details',
    });
  }
};

module.exports = {
  uploadSpreadsheet,
  getImports,
  getImportById,
};


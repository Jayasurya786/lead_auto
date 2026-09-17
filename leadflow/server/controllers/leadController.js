const { Lead, Business, Contact, EmailMessage } = require('../models');
const {
  normalizeBusinessName,
  normalizePhone,
  normalizeEmail,
} = require('../utils/normalizers');

// @desc    Get dashboard metrics and statistics
// @route   GET /api/leads/stats
// @access  Private
const getLeadStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const [
      totalBusinesses,
      totalLeads,
      newLeads,
      emailsAvailable,
      emailsSent,
      emailsOpened,
      emailsClicked,
      replies,
      followUpsDue,
      recentLeads,
      recentEmails,
    ] = await Promise.all([
      Business.countDocuments({ userId }),
      Lead.countDocuments({ userId }),
      Lead.countDocuments({ userId, leadStatus: 'NEW' }),
      Lead.countDocuments({ userId, email: { $exists: true, $ne: '' } }),
      EmailMessage.countDocuments({ userId, status: { $in: ['SENT', 'SIMULATED'] } }),
      EmailMessage.countDocuments({ userId, openCount: { $gt: 0 } }),
      EmailMessage.countDocuments({ userId, clickCount: { $gt: 0 } }),
      Lead.countDocuments({ userId, leadStatus: 'REPLIED' }),
      Lead.countDocuments({
        userId,
        $or: [
          { emailStatus: 'FOLLOW_UP_DUE' },
          { nextFollowUpDate: { $lte: now, $ne: null } },
        ],
      }),
      Lead.find({ userId }).sort({ createdAt: -1 }).limit(5),
      EmailMessage.find({ userId }).populate('leadId', 'businessName').sort({ sentAt: -1 }).limit(5),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalBusinesses,
        totalLeads,
        newLeads,
        emailsAvailable,
        emailsSent,
        emailsOpened,
        emailsClicked,
        replies,
        followUpsDue,
      },
      recentActivity: {
        leads: recentLeads,
        emails: recentEmails,
      },
    });
  } catch (error) {
    console.error('Lead stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard metrics',
    });
  }
};

// @desc    Get leads with filtering, search, sorting, and pagination
// @route   GET /api/leads
// @access  Private
const getLeads = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      search,
      category,
      city,
      leadStatus,
      emailStatus,
      websiteStatus,
      hasEmail,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { userId };

    // Search by name, email, phone, city, or category
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { businessName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { city: searchRegex },
        { category: searchRegex },
      ];
    }

    if (category) query.category = new RegExp(`^${category.trim()}$`, 'i');
    if (city) query.city = new RegExp(`^${city.trim()}$`, 'i');
    if (leadStatus) query.leadStatus = leadStatus;
    if (emailStatus) query.emailStatus = emailStatus;
    if (websiteStatus) query.websiteStatus = websiteStatus;

    if (hasEmail === 'true') {
      query.email = { $exists: true, $ne: '' };
    } else if (hasEmail === 'false') {
      query.$or = [{ email: { $exists: false } }, { email: '' }, { email: null }];
    }

    const sortOrder = order.toLowerCase() === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [leads, total, distinctCategories, distinctCities] = await Promise.all([
      Lead.find(query).sort(sortOptions).skip(skip).limit(limitNum),
      Lead.countDocuments(query),
      Lead.distinct('category', { userId, category: { $ne: '' } }),
      Lead.distinct('city', { userId, city: { $ne: '' } }),
    ]);

    return res.status(200).json({
      success: true,
      data: leads,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
      filters: {
        categories: distinctCategories.slice(0, 50),
        cities: distinctCities.slice(0, 50),
      },
    });
  } catch (error) {
    console.error('Get leads error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching leads',
    });
  }
};

// @desc    Get single lead by ID
// @route   GET /api/leads/:id
// @access  Private
const getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    const [contacts, emailHistory] = await Promise.all([
      Contact.find({ leadId: lead._id, userId: req.user._id }).sort({ isPrimary: -1, createdAt: -1 }),
      EmailMessage.find({ leadId: lead._id, userId: req.user._id }).sort({ sentAt: -1 }),
    ]);

    return res.status(200).json({
      success: true,
      data: lead,
      contacts,
      emailHistory,
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Create lead manually
// @route   POST /api/leads
// @access  Private
const createLead = async (req, res) => {
  try {
    const { businessName, category, address, city, state, country, phone, email, notes } = req.body;

    if (!businessName) {
      return res.status(400).json({
        success: false,
        message: 'Business name is required',
      });
    }

    const normName = normalizeBusinessName(businessName);
    const normPhone = normalizePhone(phone);
    const normEmail = normalizeEmail(email);

    const lead = await Lead.create({
      userId: req.user._id,
      businessName: businessName.trim(),
      normalizedBusinessName: normName,
      category: category ? category.trim() : '',
      address: address ? address.trim() : '',
      city: city ? city.trim() : '',
      state: state ? state.trim() : '',
      country: country ? country.trim() : '',
      phone: phone ? phone.trim() : '',
      normalizedPhone: normPhone,
      email: email ? email.trim() : '',
      normalizedEmail: normEmail,
      website: '',
      websiteStatus: 'NO_WEBSITE',
      leadStatus: 'NEW',
      emailStatus: 'NOT_SENT',
      source: 'Manual Entry',
      notes: notes
        ? [{ content: notes, createdBy: req.user.name, createdAt: new Date() }]
        : [],
    });

    if (email || phone) {
      await Contact.create({
        userId: req.user._id,
        leadId: lead._id,
        name: businessName,
        email: email || '',
        phone: phone || '',
        source: 'Manual Entry',
        isPrimary: true,
      });
    }

    return res.status(201).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating lead',
    });
  }
};

// @desc    Update lead details
// @route   PUT /api/leads/:id
// @access  Private
const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    const allowedFields = [
      'businessName',
      'category',
      'address',
      'city',
      'state',
      'country',
      'phone',
      'email',
      'website',
      'mapsUrl',
      'rating',
      'reviews',
      'leadStatus',
      'emailStatus',
      'nextFollowUpDate',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        lead[field] = req.body[field];
      }
    });

    if (req.body.businessName) {
      lead.normalizedBusinessName = normalizeBusinessName(req.body.businessName);
    }
    if (req.body.phone !== undefined) {
      lead.normalizedPhone = normalizePhone(req.body.phone);
    }
    if (req.body.email !== undefined) {
      lead.normalizedEmail = normalizeEmail(req.body.email);
    }

    await lead.save();

    return res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating lead',
    });
  }
};

// @desc    Add note to lead
// @route   POST /api/leads/:id/notes
// @access  Private
const addNote = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Note content cannot be empty.',
      });
    }

    const lead = await Lead.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    lead.notes.push({
      content: content.trim(),
      createdBy: req.user.name,
      createdAt: new Date(),
    });

    await lead.save();

    return res.status(200).json({
      success: true,
      data: lead.notes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error adding note',
    });
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    // Clean up associated contacts and email messages
    await Promise.all([
      Contact.deleteMany({ leadId: lead._id, userId: req.user._id }),
      EmailMessage.deleteMany({ leadId: lead._id, userId: req.user._id }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Lead and related records deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting lead',
    });
  }
};

// @desc    Bulk action on leads (archive, delete, change status)
// @route   POST /api/leads/bulk
// @access  Private
const bulkAction = async (req, res) => {
  try {
    const { leadIds, action, statusValue } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of lead IDs.',
      });
    }

    const query = { _id: { $in: leadIds }, userId: req.user._id };

    if (action === 'delete') {
      await Promise.all([
        Lead.deleteMany(query),
        Contact.deleteMany({ leadId: { $in: leadIds }, userId: req.user._id }),
      ]);
      return res.status(200).json({
        success: true,
        message: `Deleted ${leadIds.length} leads.`,
      });
    }

    if (action === 'archive') {
      await Lead.updateMany(query, { $set: { leadStatus: 'ARCHIVED' } });
      return res.status(200).json({
        success: true,
        message: `Archived ${leadIds.length} leads.`,
      });
    }

    if (action === 'updateStatus' && statusValue) {
      await Lead.updateMany(query, { $set: { leadStatus: statusValue } });
      return res.status(200).json({
        success: true,
        message: `Updated status to ${statusValue} for ${leadIds.length} leads.`,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid bulk action specified.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error processing bulk action',
    });
  }
};

// @desc    Get public lead preview details for the website mockup page
// @route   GET /api/leads/public/:id
// @access  Public
const getPublicLeadPreview = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id).select(
      'businessName category city state country address phone rating reviews mapsUrl'
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getLeadStats,
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  addNote,
  deleteLead,
  bulkAction,
  getPublicLeadPreview,
};


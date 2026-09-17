const { Contact, Lead } = require('../models');

// @desc    Get contacts list with search and lead filtering
// @route   GET /api/contacts
// @access  Private
const getContacts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { search, leadId, page = 1, limit = 20 } = req.query;

    const query = { userId };
    if (leadId) query.leadId = leadId;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .populate('leadId', 'businessName city leadStatus')
        .sort({ isPrimary: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Contact.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: contacts,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching contacts',
    });
  }
};

// @desc    Create contact for a lead
// @route   POST /api/contacts
// @access  Private
const createContact = async (req, res) => {
  try {
    const { leadId, name, email, phone, isPrimary, verified, source } = req.body;

    if (!leadId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Lead ID and contact name are required.',
      });
    }

    // Verify lead ownership
    const lead = await Lead.findOne({ _id: leadId, userId: req.user._id });
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found.',
      });
    }

    // If marked primary, unset existing primary contacts for this lead
    if (isPrimary) {
      await Contact.updateMany({ leadId, userId: req.user._id }, { $set: { isPrimary: false } });
    }

    const contact = await Contact.create({
      userId: req.user._id,
      leadId,
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : '',
      phone: phone ? phone.trim() : '',
      isPrimary: Boolean(isPrimary),
      verified: Boolean(verified),
      source: source || 'Manual Entry',
    });

    return res.status(201).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating contact',
    });
  }
};

// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Private
const updateContact = async (req, res) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, userId: req.user._id });
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    const { name, email, phone, isPrimary, verified } = req.body;

    if (name) contact.name = name.trim();
    if (email !== undefined) contact.email = email.trim().toLowerCase();
    if (phone !== undefined) contact.phone = phone.trim();
    if (verified !== undefined) contact.verified = Boolean(verified);

    if (isPrimary && !contact.isPrimary) {
      await Contact.updateMany({ leadId: contact.leadId, userId: req.user._id }, { $set: { isPrimary: false } });
      contact.isPrimary = true;
    } else if (isPrimary !== undefined) {
      contact.isPrimary = Boolean(isPrimary);
    }

    await contact.save();

    return res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating contact',
    });
  }
};

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Private
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting contact',
    });
  }
};

module.exports = {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
};


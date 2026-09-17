const { EmailTemplate, Lead, Contact } = require('../models');

// Helper to interpolate variables into template string
const interpolate = (text, vars) => {
  if (!text) return '';
  return text.replace(/{{\s*([\w_]+)\s*}}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
};

// @desc    Get all templates for user
// @route   GET /api/templates
// @access  Private
const getTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.find({ userId: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching templates',
    });
  }
};

// @desc    Get single template
// @route   GET /api/templates/:id
// @access  Private
const getTemplateById = async (req, res) => {
  try {
    const template = await EmailTemplate.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching template',
    });
  }
};

// @desc    Create template
// @route   POST /api/templates
// @access  Private
const createTemplate = async (req, res) => {
  try {
    const { name, subject, body, variables, isDefault } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Template name, subject, and body are required.',
      });
    }

    if (isDefault) {
      await EmailTemplate.updateMany(
        { userId: req.user._id },
        { $set: { isDefault: false } }
      );
    }

    const template = await EmailTemplate.create({
      userId: req.user._id,
      name: name.trim(),
      subject: subject.trim(),
      body,
      variables: variables || ['business_name', 'contact_name', 'category', 'city', 'sender_name'],
      isDefault: Boolean(isDefault),
    });

    return res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating template',
    });
  }
};

// @desc    Update template
// @route   PUT /api/templates/:id
// @access  Private
const updateTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    const { name, subject, body, variables, isDefault } = req.body;

    if (name) template.name = name.trim();
    if (subject) template.subject = subject.trim();
    if (body) template.body = body;
    if (variables) template.variables = variables;

    if (isDefault && !template.isDefault) {
      await EmailTemplate.updateMany(
        { userId: req.user._id },
        { $set: { isDefault: false } }
      );
      template.isDefault = true;
    } else if (isDefault !== undefined) {
      template.isDefault = Boolean(isDefault);
    }

    await template.save();

    return res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating template',
    });
  }
};

// @desc    Delete template
// @route   DELETE /api/templates/:id
// @access  Private
const deleteTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting template',
    });
  }
};

// @desc    Duplicate template
// @route   POST /api/templates/:id/duplicate
// @access  Private
const duplicateTemplate = async (req, res) => {
  try {
    const source = await EmailTemplate.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!source) {
      return res.status(404).json({
        success: false,
        message: 'Source template not found',
      });
    }

    const copy = await EmailTemplate.create({
      userId: req.user._id,
      name: `Copy of ${source.name}`,
      subject: source.subject,
      body: source.body,
      variables: source.variables,
      isDefault: false,
    });

    return res.status(201).json({
      success: true,
      data: copy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error duplicating template',
    });
  }
};

// @desc    Preview template with personalized lead data
// @route   POST /api/templates/preview
// @access  Private
const previewTemplate = async (req, res) => {
  try {
    const { subject, body, templateId, leadId } = req.body;

    let targetSubject = subject;
    let targetBody = body;

    if (templateId) {
      const tpl = await EmailTemplate.findOne({ _id: templateId, userId: req.user._id });
      if (tpl) {
        targetSubject = tpl.subject;
        targetBody = tpl.body;
      }
    }

    let vars = {
      business_name: 'Apex Salon & Spa',
      contact_name: 'Alex Johnson',
      category: 'Hair & Beauty Salon',
      city: 'Austin',
      sender_name: req.user.name || 'Outreach Specialist',
    };

    if (leadId) {
      const lead = await Lead.findOne({ _id: leadId, userId: req.user._id });
      if (lead) {
        const primaryContact = await Contact.findOne({
          leadId: lead._id,
          userId: req.user._id,
          isPrimary: true,
        });

        vars = {
          business_name: lead.businessName || 'Business',
          contact_name: primaryContact ? primaryContact.name : lead.businessName,
          category: lead.category || 'Local Business',
          city: lead.city || 'your area',
          sender_name: req.user.name || 'Outreach Specialist',
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        subject: interpolate(targetSubject, vars),
        body: interpolate(targetBody, vars),
        variablesUsed: vars,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error rendering template preview',
    });
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  previewTemplate,
  interpolate,
};


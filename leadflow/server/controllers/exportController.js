const xlsx = require('xlsx');
const { Business, Lead, Contact, EmailMessage } = require('../models');

// @desc    Export data as CSV or XLSX
// @route   GET /api/export
// @access  Private
const exportData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { format = 'csv', type = 'leads' } = req.query;

    let data = [];
    let fileNamePrefix = 'leadflow_export';

    switch (type) {
      case 'businesses': {
        fileNamePrefix = 'all_businesses';
        const docs = await Business.find({ userId }).sort({ createdAt: -1 });
        data = docs.map((b) => ({
          'Business Name': b.businessName,
          'Category': b.category,
          'Address': b.address,
          'City': b.city,
          'State': b.state,
          'Country': b.country,
          'Phone': b.phone,
          'Email': b.email,
          'Website': b.website,
          'Website Status': b.websiteStatus,
          'Maps URL': b.mapsUrl,
          'Rating': b.rating || '',
          'Reviews': b.reviews || '',
          'Created Date': b.createdAt ? b.createdAt.toISOString().split('T')[0] : '',
        }));
        break;
      }

      case 'contacts': {
        fileNamePrefix = 'contacts';
        const docs = await Contact.find({ userId }).populate('leadId', 'businessName city').sort({ createdAt: -1 });
        data = docs.map((c) => ({
          'Business Name': c.leadId ? c.leadId.businessName : '',
          'City': c.leadId ? c.leadId.city : '',
          'Contact Name': c.name,
          'Email': c.email,
          'Phone': c.phone,
          'Primary': c.isPrimary ? 'Yes' : 'No',
          'Verified': c.verified ? 'Yes' : 'No',
          'Source': c.source,
          'Created Date': c.createdAt ? c.createdAt.toISOString().split('T')[0] : '',
        }));
        break;
      }

      case 'sent': {
        fileNamePrefix = 'emails_sent';
        const docs = await Lead.find({
          userId,
          emailStatus: { $in: ['SENT', 'FOLLOW_UP_SENT'] },
        }).sort({ lastContactedAt: -1 });
        data = docs.map((l) => ({
          'Business Name': l.businessName,
          'Category': l.category,
          'City': l.city,
          'Phone': l.phone,
          'Email': l.email,
          'Lead Status': l.leadStatus,
          'Email Status': l.emailStatus,
          'Last Contacted': l.lastContactedAt ? l.lastContactedAt.toISOString().split('T')[0] : '',
        }));
        break;
      }

      case 'unsent': {
        fileNamePrefix = 'emails_not_sent';
        const docs = await Lead.find({
          userId,
          emailStatus: 'NOT_SENT',
        }).sort({ createdAt: -1 });
        data = docs.map((l) => ({
          'Business Name': l.businessName,
          'Category': l.category,
          'City': l.city,
          'Phone': l.phone,
          'Email': l.email,
          'Has Email': l.email ? 'Yes' : 'No',
          'Lead Status': l.leadStatus,
          'Created Date': l.createdAt ? l.createdAt.toISOString().split('T')[0] : '',
        }));
        break;
      }

      case 'followups': {
        fileNamePrefix = 'follow_ups_due';
        const now = new Date();
        const docs = await Lead.find({
          userId,
          $or: [
            { emailStatus: 'FOLLOW_UP_DUE' },
            { nextFollowUpDate: { $lte: now, $ne: null } },
          ],
        }).sort({ nextFollowUpDate: 1 });
        data = docs.map((l) => ({
          'Business Name': l.businessName,
          'Category': l.category,
          'City': l.city,
          'Phone': l.phone,
          'Email': l.email,
          'Lead Status': l.leadStatus,
          'Email Status': l.emailStatus,
          'Follow-up Due Date': l.nextFollowUpDate ? l.nextFollowUpDate.toISOString().split('T')[0] : '',
        }));
        break;
      }

      case 'leads':
      default: {
        fileNamePrefix = 'leads_only';
        const docs = await Lead.find({ userId }).sort({ createdAt: -1 });
        data = docs.map((l) => ({
          'Business Name': l.businessName,
          'Category': l.category,
          'Address': l.address,
          'City': l.city,
          'State': l.state,
          'Country': l.country,
          'Phone': l.phone,
          'Email': l.email,
          'Website': l.website || 'NO_WEBSITE',
          'Maps URL': l.mapsUrl,
          'Rating': l.rating || '',
          'Reviews': l.reviews || '',
          'Lead Status': l.leadStatus,
          'Email Status': l.emailStatus,
          'Follow-up Due': l.nextFollowUpDate ? l.nextFollowUpDate.toISOString().split('T')[0] : '',
          'Created Date': l.createdAt ? l.createdAt.toISOString().split('T')[0] : '',
        }));
        break;
      }
    }

    // Build worksheet and workbook
    const ws = xlsx.utils.json_to_sheet(data.length > 0 ? data : [{ Message: 'No records found' }]);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Export');

    const isXlsx = format.toLowerCase() === 'xlsx';
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${fileNamePrefix}_${timestamp}.${isXlsx ? 'xlsx' : 'csv'}`;

    if (isXlsx) {
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(buffer);
    } else {
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'csv' });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(buffer);
    }
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating export file',
    });
  }
};

module.exports = {
  exportData,
};


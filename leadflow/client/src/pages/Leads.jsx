import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  Mail,
  Eye,
  Trash2,
  Archive,
  Download,
  Send,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  AlertCircle,
  X,
  MessageCircle,
  LayoutGrid,
  List,
} from 'lucide-react';
import { leadService } from '../services/leadService';
import { templateService } from '../services/templateService';
import { gmailService } from '../services/gmailService';
import { exportService } from '../services/exportService';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import ConfirmModal from '../components/common/ConfirmModal';
import KanbanBoard from '../components/leads/KanbanBoard';

export default function Leads() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 20 });
  const [filterOptions, setFilterOptions] = useState({ categories: [], cities: [] });
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [leadStatus, setLeadStatus] = useState(searchParams.get('leadStatus') || '');
  const [emailStatus, setEmailStatus] = useState(searchParams.get('emailStatus') || '');
  const [hasEmail, setHasEmail] = useState(searchParams.get('hasEmail') || '');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'

  const handleUpdateLeadStatus = async (leadId, targetStageId) => {
    try {
      setLeads((prev) =>
        prev.map((l) => (l._id === leadId ? { ...l, leadStatus: targetStageId } : l))
      );
      await leadService.updateLead(leadId, { leadStatus: targetStageId });
    } catch (err) {
      console.error('Failed to update lead status', err);
      fetchLeads(pagination.page);
    }
  };

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Bulk email modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [bulkSubject, setBulkSubject] = useState('Website for {{business_name}}');
  const [bulkBody, setBulkBody] = useState('Hi,\n\nI noticed {{business_name}} in {{city}} does not have a website.\n\nWould you like to see a custom design preview?\n\nRegards,');
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const fetchLeads = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        search: search.trim() || undefined,
        category: category || undefined,
        city: city || undefined,
        leadStatus: leadStatus || undefined,
        emailStatus: emailStatus || undefined,
        hasEmail: hasEmail || undefined,
        sortBy,
        order,
      };

      const res = await leadService.getLeads(params);
      if (res.success) {
        setLeads(res.data);
        setPagination(res.pagination);
        if (res.filters) {
          setFilterOptions(res.filters);
        }
      }
    } catch (err) {
      console.error('Error loading leads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(1);
    setSelectedIds([]);
  }, [category, city, leadStatus, emailStatus, hasEmail, sortBy, order]);

  // Load templates for bulk email modal
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await templateService.getTemplates();
        if (res.success && res.data.length > 0) {
          setTemplates(res.data);
          const def = res.data.find((t) => t.isDefault) || res.data[0];
          setSelectedTemplateId(def._id);
          setBulkSubject(def.subject);
          setBulkBody(def.body);
        }
      } catch (err) {
        console.warn('Failed to load templates for bulk modal');
      }
    };
    loadTemplates();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeads(1);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleArchiveLead = async (id) => {
    try {
      await leadService.updateLead(id, { leadStatus: 'ARCHIVED' });
      fetchLeads(pagination.page);
    } catch (err) {
      alert('Failed to archive lead');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await leadService.deleteLead(deleteTargetId);
      setDeleteTargetId(null);
      fetchLeads(pagination.page);
    } catch (err) {
      alert('Failed to delete lead');
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    try {
      await leadService.bulkAction(selectedIds, 'archive');
      setSelectedIds([]);
      fetchLeads(pagination.page);
    } catch (err) {
      alert('Failed to bulk archive');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected leads?`)) {
      try {
        await leadService.bulkAction(selectedIds, 'delete');
        setSelectedIds([]);
        fetchLeads(pagination.page);
      } catch (err) {
        alert('Failed to bulk delete');
      }
    }
  };

  const handleTemplateChange = (tplId) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t._id === tplId);
    if (tpl) {
      setBulkSubject(tpl.subject);
      setBulkBody(tpl.body);
    }
  };

  const handleConfirmBulkSend = async () => {
    try {
      setBulkSending(true);
      const res = await gmailService.sendBulk({
        leadIds: selectedIds,
        subjectTemplate: bulkSubject,
        bodyTemplate: bulkBody,
        simulateIfNoGmail: true, // Auto fallback to simulation if no Gmail connected
      });

      if (res.success) {
        setBulkResult(res);
        fetchLeads(pagination.page);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing bulk send');
    } finally {
      setBulkSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lead Pipeline</h1>
          <p className="text-sm text-slate-500">
            {pagination.total.toLocaleString()} total qualified leads discovered without websites.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          <button
            onClick={() => exportService.downloadExport('leads', 'csv')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => exportService.downloadExport('leads', 'xlsx')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export XLSX</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search box */}
          <form onSubmit={handleSearchSubmit} className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search business, city, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800"
            />
          </form>

          {/* Lead status filter */}
          <select
            value={leadStatus}
            onChange={(e) => setLeadStatus(e.target.value)}
            className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Lead Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="REPLIED">Replied</option>
            <option value="INTERESTED">Interested</option>
            <option value="NOT_INTERESTED">Not Interested</option>
            <option value="CONVERTED">Converted</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Email status filter */}
          <select
            value={emailStatus}
            onChange={(e) => setEmailStatus(e.target.value)}
            className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Email Statuses</option>
            <option value="NOT_SENT">Not Sent</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
            <option value="FOLLOW_UP_DUE">Follow-up Due</option>
            <option value="FOLLOW_UP_SENT">Follow-up Sent</option>
          </select>

          {/* Has email filter */}
          <select
            value={hasEmail}
            onChange={(e) => setHasEmail(e.target.value)}
            className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">Email Availability</option>
            <option value="true">Has Email</option>
            <option value="false">No Email</option>
          </select>

          {/* Sorting */}
          <select
            value={`${sortBy}-${order}`}
            onChange={(e) => {
              const [sb, ord] = e.target.value.split('-');
              setSortBy(sb);
              setOrder(ord);
            }}
            className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="businessName-asc">Name (A-Z)</option>
            <option value="businessName-desc">Name (Z-A)</option>
            <option value="city-asc">City (A-Z)</option>
          </select>
        </div>

        {/* Bulk action toolbar (if items selected) */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-sky-50 border border-sky-200 rounded-lg animate-fadeIn">
            <span className="text-xs font-semibold text-sky-800">
              {selectedIds.length} lead{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setBulkResult(null);
                  setShowBulkModal(true);
                }}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
              >
                <Send className="h-3 w-3" />
                <span>Send Selected</span>
              </button>
              <button
                onClick={handleBulkArchive}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium rounded-md transition-colors"
              >
                <Archive className="h-3 w-3" />
                <span>Archive</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium rounded-md transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Switcher: Table vs Kanban */}
      {viewMode === 'kanban' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          {loading ? (
            <div className="p-6">
              <LoadingSkeleton rows={6} />
            </div>
          ) : (
            <KanbanBoard leads={leads} onUpdateLeadStatus={handleUpdateLeadStatus} />
          )}
        </div>
      ) : (
        /* Leads Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6">
              <LoadingSkeleton rows={6} />
            </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Sparkles className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No leads found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Try adjusting your search criteria or upload a new spreadsheet with businesses missing websites.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <button onClick={handleSelectAll} className="p-1 text-slate-400 hover:text-slate-600">
                      {selectedIds.length === leads.length ? (
                        <CheckSquare className="h-4 w-4 text-sky-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">Business</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">City</th>
                  <th className="p-3">Website</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Lead Status</th>
                  <th className="p-3">Email Status</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {leads.map((lead) => {
                  const isSelected = selectedIds.includes(lead._id);
                  return (
                    <tr
                      key={lead._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-sky-50/40' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleSelectOne(lead._id)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-sky-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 font-semibold text-slate-900 max-w-[200px] truncate">
                        <Link to={`/leads/${lead._id}`} className="hover:text-sky-600">
                          {lead.businessName}
                        </Link>
                        {lead.mapsUrl && (
                          <a
                            href={lead.mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block ml-1.5 text-slate-400 hover:text-sky-600"
                            title="Open Google Maps"
                          >
                            <ExternalLink className="h-3 w-3 inline" />
                          </a>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 truncate max-w-[120px]">
                        {lead.category || '-'}
                      </td>
                      <td className="p-3 text-slate-600 truncate max-w-[100px]">
                        {lead.city || '-'}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          NO WEBSITE
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] max-w-[160px] truncate">
                        {lead.email ? (
                          <span className="text-slate-800">{lead.email}</span>
                        ) : (
                          <span className="text-slate-300 italic">none</span>
                        )}
                      </td>
                      <td className="p-3">
                        <StatusBadge type="lead" value={lead.leadStatus} />
                      </td>
                      <td className="p-3">
                        <StatusBadge type="email" value={lead.emailStatus} />
                      </td>
                      <td className="p-3 text-slate-400">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right space-x-1.5 shrink-0 whitespace-nowrap">
                        {/* 1-Click WhatsApp for phone numbers */}
                        {lead.phone && (
                          <a
                            href={`https://wa.me/${(lead.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Hi, I noticed ${lead.businessName} doesn't have an active website. We created a concept preview for your business: ${window.location.origin}/preview/${lead._id}`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            title="1-Click WhatsApp Outreach"
                            className="p-1.5 inline-block text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {/* Instant Mockup Landing Page */}
                        <a
                          href={`/preview/${lead._id}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Instant Website Concept Preview"
                          className="p-1.5 inline-block text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                        </a>
                        <Link
                          to={`/leads/${lead._id}`}
                          title="View Details"
                          className="p-1.5 inline-block text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        {lead.email && (
                          <Link
                            to={`/email-compose/${lead._id}`}
                            title="Compose Outreach"
                            className="p-1.5 inline-block text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </Link>
                        )}
                        <button
                          onClick={() => handleArchiveLead(lead._id)}
                          title="Archive Lead"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(lead._id)}
                          title="Delete Lead"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {pagination.page} of {pagination.pages} ({pagination.total} leads)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchLeads(pagination.page - 1)}
                className="px-2.5 py-1 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchLeads(pagination.page + 1)}
                className="px-2.5 py-1 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Delete Single Lead Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Delete Lead"
        message="Are you sure you want to permanently delete this lead? All associated contacts and outreach history for this lead will also be removed."
        confirmText="Delete Lead"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Bulk Email Outreach Safety Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 relative border border-slate-200 space-y-4">
            <button
              onClick={() => setShowBulkModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Send className="h-5 w-5 text-sky-600" />
                <span>Bulk Outreach Email</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                You are about to send personalized cold outreach to {selectedIds.length} selected leads.
              </p>
            </div>

            {!bulkResult ? (
              <div className="space-y-4">
                {/* Template Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Choose Email Template
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    {templates.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} {t.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Template */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject Line (Supports Variables)
                  </label>
                  <input
                    type="text"
                    value={bulkSubject}
                    onChange={(e) => setBulkSubject(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
                  />
                </div>

                {/* Body Template */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Message Body
                  </label>
                  <textarea
                    rows={6}
                    value={bulkBody}
                    onChange={(e) => setBulkBody(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
                  />
                </div>

                {/* Safety Warning */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <strong>Rate Limit & Safety Protection:</strong> A 200ms delay is placed between sends to respect Gmail quotas. Leads without email addresses will be skipped automatically.
                  </div>
                </div>

                {/* Modal actions */}
                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    disabled={bulkSending}
                    className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBulkSend}
                    disabled={bulkSending}
                    className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm flex items-center space-x-2"
                  >
                    {bulkSending ? (
                      <>
                        <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Emails...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Confirm Send ({selectedIds.length})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Bulk Results Summary */
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs space-y-2">
                  <p className="font-bold text-sm">Bulk Outreach Completed</p>
                  <p>
                    Successfully dispatched: <strong>{bulkResult.summary.sent}</strong> | Failed/Skipped:{' '}
                    <strong>{bulkResult.summary.failed}</strong>
                  </p>
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg text-xs">
                  {bulkResult.results.map((r, i) => (
                    <div key={i} className="p-2 flex items-center justify-between">
                      <span className="font-medium text-slate-800">{r.businessName}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          r.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setShowBulkModal(false);
                      setBulkResult(null);
                      setSelectedIds([]);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


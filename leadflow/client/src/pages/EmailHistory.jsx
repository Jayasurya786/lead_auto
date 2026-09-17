import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Search,
  Mail,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

export default function EmailHistory() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 20 });

  // Message preview modal
  const [viewingEmail, setViewingEmail] = useState(null);

  const fetchEmails = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/email-history', {
        params: {
          page,
          limit: 20,
          search: search.trim() || undefined,
          status: statusFilter || undefined,
        },
      });
      if (res.data.success) {
        setEmails(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching email history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEmails(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Outreach History</h1>
          <p className="text-sm text-slate-500">
            {pagination.total.toLocaleString()} total cold outreach emails logged and tracked.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search recipient, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="SENT">Sent</option>
            <option value="SIMULATED">Simulated</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={5} />
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-16 px-4 text-slate-400">
            <History className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-700">No emails sent yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Emails dispatched through Gmail or dev simulation will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Business</th>
                  <th className="p-3.5">Recipient</th>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Sent Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {emails.map((msg) => (
                  <tr key={msg._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-semibold text-slate-900">
                      {msg.leadId ? (
                        <Link to={`/leads/${msg.leadId._id}`} className="hover:text-sky-600">
                          {msg.leadId.businessName}
                        </Link>
                      ) : (
                        <span className="text-slate-400 italic">Lead removed</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-800">
                      {msg.recipient}
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium max-w-xs truncate">
                      {msg.subject}
                    </td>
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(msg.sentAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-3.5 space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <StatusBadge type="email" value={msg.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {msg.openCount > 0 ? (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                            title={`Opened at ${msg.openedAt ? new Date(msg.openedAt).toLocaleString() : ''}`}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {msg.openCount}x opened
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-400 border border-slate-200">
                            Unopened
                          </span>
                        )}
                        {msg.clickCount > 0 && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200"
                            title={`Clicked at ${msg.clickedAt ? new Date(msg.clickedAt).toLocaleString() : ''}`}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {msg.clickCount}x clicked
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setViewingEmail(msg)}
                        title="View Email Message"
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchEmails(pagination.page - 1)}
                className="px-2.5 py-1 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchEmails(pagination.page + 1)}
                className="px-2.5 py-1 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Email Modal */}
      {viewingEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative border border-slate-200 space-y-4">
            <button
              onClick={() => setViewingEmail(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                Dispatched Email
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{viewingEmail.subject}</h3>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">To:</span>
                <span className="font-mono text-slate-800 font-semibold">{viewingEmail.recipient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-700">{new Date(viewingEmail.sentAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Message ID:</span>
                <span className="font-mono text-[10px] text-slate-600 truncate max-w-[240px]">
                  {viewingEmail.messageId || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <StatusBadge type="email" value={viewingEmail.status} />
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-2">
                <span className="text-slate-500">Opens Tracked:</span>
                <span className="font-semibold text-slate-800">
                  {viewingEmail.openCount > 0
                    ? `${viewingEmail.openCount}x (${new Date(viewingEmail.openedAt).toLocaleString()})`
                    : 'Not opened yet'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Link Clicks:</span>
                <span className="font-semibold text-slate-800">
                  {viewingEmail.clickCount > 0
                    ? `${viewingEmail.clickCount}x (${new Date(viewingEmail.clickedAt).toLocaleString()})`
                    : 'No links clicked'}
                </span>
              </div>
            </div>

            {viewingEmail.error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                <strong>Error Log:</strong> {viewingEmail.error}
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-1">Message Body:</span>
              <div className="p-3.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-sans">
                {viewingEmail.body}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingEmail(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


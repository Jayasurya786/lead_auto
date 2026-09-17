import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Mail,
  Phone,
  Search,
  CheckCircle2,
  Trash2,
  Star,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  MessageCircle,
} from 'lucide-react';
import { contactService } from '../services/contactService';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 20 });

  const fetchContacts = async (page = 1) => {
    try {
      setLoading(true);
      const res = await contactService.getContacts({
        page,
        limit: 20,
        search: search.trim() || undefined,
      });
      if (res.success) {
        setContacts(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Error fetching contacts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(1);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchContacts(1);
  };

  const handleTogglePrimary = async (contact) => {
    try {
      const res = await contactService.updateContact(contact._id, {
        isPrimary: !contact.isPrimary,
      });
      if (res.success) {
        fetchContacts(pagination.page);
      }
    } catch (err) {
      alert('Failed to update primary status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this contact record?')) {
      try {
        await contactService.deleteContact(id);
        fetchContacts(pagination.page);
      } catch (err) {
        alert('Failed to delete contact');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Contacts</h1>
          <p className="text-sm text-slate-500">
            {pagination.total} individual stakeholder contacts across discovered lead accounts.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={5} />
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-16 px-4 text-slate-400">
            <Building2 className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-700">No contacts found</p>
            <p className="text-xs text-slate-400 mt-1">
              Contacts are automatically extracted during spreadsheet upload or added via Lead Details.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Contact Name</th>
                  <th className="p-3.5">Associated Lead / Business</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Primary</th>
                  <th className="p-3.5">Source</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {contacts.map((contact) => (
                  <tr key={contact._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-semibold text-slate-900">
                      {contact.name}
                    </td>
                    <td className="p-3.5">
                      {contact.leadId ? (
                        <Link
                          to={`/leads/${contact.leadId._id}`}
                          className="font-medium text-sky-600 hover:underline flex items-center space-x-1"
                        >
                          <span>{contact.leadId.businessName}</span>
                          <ExternalLink className="h-3 w-3 inline opacity-60" />
                        </Link>
                      ) : (
                        <span className="text-slate-400 italic">Unlinked</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-800">
                      {contact.email || <span className="text-slate-300 italic">none</span>}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {contact.phone || <span className="text-slate-300 italic">-</span>}
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleTogglePrimary(contact)}
                        title={contact.isPrimary ? 'Primary contact' : 'Click to make primary'}
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                          contact.isPrimary
                            ? 'bg-sky-50 text-sky-700 border-sky-300'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Star className={`h-3 w-3 ${contact.isPrimary ? 'fill-sky-500 text-sky-500' : ''}`} />
                        <span>{contact.isPrimary ? 'Primary' : 'Secondary'}</span>
                      </button>
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {contact.source || 'Import'}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {contact.phone && (
                        <a
                          href={`https://wa.me/${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Hi ${contact.name || ''}, I noticed ${contact.leadId?.businessName || 'your business'} doesn't have an active website. We created a free concept preview for your business: ${window.location.origin}/preview/${contact.leadId?._id || ''}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          title="1-Click WhatsApp Outreach"
                          className="p-1.5 inline-block text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {contact.email && contact.leadId && (
                        <Link
                          to={`/email-compose/${contact.leadId._id}?recipient=${encodeURIComponent(contact.email)}`}
                          title="Compose Email"
                          className="p-1.5 inline-block text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </Link>
                      )}
                      <button
                        onClick={() => handleDelete(contact._id)}
                        title="Delete Contact"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
                onClick={() => fetchContacts(pagination.page - 1)}
                className="px-2.5 py-1 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchContacts(pagination.page + 1)}
                className="px-2.5 py-1 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


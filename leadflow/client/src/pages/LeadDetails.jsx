import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Edit,
  Send,
  Archive,
  CheckCircle2,
  Plus,
  Clock,
  Trash2,
  Star,
  MessageSquare,
  MessageCircle,
} from 'lucide-react';
import { leadService } from '../services/leadService';
import { contactService } from '../services/contactService';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [emailHistory, setEmailHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit lead modal
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Add note state
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Add contact modal
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', isPrimary: false });

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await leadService.getLeadById(id);
      if (res.success) {
        setLead(res.data);
        setContacts(res.contacts || []);
        setEmailHistory(res.emailHistory || []);
        setEditForm({
          businessName: res.data.businessName || '',
          category: res.data.category || '',
          address: res.data.address || '',
          city: res.data.city || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          leadStatus: res.data.leadStatus || 'NEW',
          emailStatus: res.data.emailStatus || 'NOT_SENT',
        });
      }
    } catch (err) {
      console.error('Error fetching lead details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    try {
      const res = await leadService.updateLead(id, editForm);
      if (res.success) {
        setLead(res.data);
        setIsEditing(false);
      }
    } catch (err) {
      alert('Failed to update lead');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      setAddingNote(true);
      const res = await leadService.addNote(id, newNote.trim());
      if (res.success) {
        setLead((prev) => ({ ...prev, notes: res.data }));
        setNewNote('');
      }
    } catch (err) {
      alert('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleMarkContacted = async () => {
    try {
      const res = await leadService.updateLead(id, { leadStatus: 'CONTACTED' });
      if (res.success) {
        setLead(res.data);
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleArchive = async () => {
    try {
      const res = await leadService.updateLead(id, { leadStatus: 'ARCHIVED' });
      if (res.success) {
        setLead(res.data);
      }
    } catch (err) {
      alert('Failed to archive lead');
    }
  };

  const handleCreateContact = async (e) => {
    e.preventDefault();
    try {
      const res = await contactService.createContact({
        leadId: lead._id,
        ...contactForm,
      });
      if (res.success) {
        setShowAddContact(false);
        setContactForm({ name: '', email: '', phone: '', isPrimary: false });
        fetchDetails();
      }
    } catch (err) {
      alert('Failed to create contact');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse"></div>
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-bold text-slate-800">Lead not found</h2>
        <Link to="/leads" className="mt-4 text-xs font-semibold text-sky-600 inline-block">
          Return to Leads
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/leads"
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 space-x-1"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Leads Pipeline</span>
      </Link>

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900">{lead.businessName}</h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
              NO WEBSITE
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {lead.category || 'Local Business'} • {lead.city ? `${lead.city}, ${lead.state || ''}` : 'Location unlisted'}
          </p>
          <div className="flex items-center space-x-3 pt-1">
            <StatusBadge type="lead" value={lead.leadStatus} />
            <StatusBadge type="email" value={lead.emailStatus} />
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsEditing(true)}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm flex items-center space-x-1.5"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>

          {/* 1-Click WhatsApp Direct Message */}
          {lead.phone && (
            <a
              href={`https://wa.me/${(lead.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                `Hi, I noticed ${lead.businessName} doesn't have an active website. We created a free concept preview for your business: ${window.location.origin}/preview/${lead._id}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>WhatsApp Outreach</span>
            </a>
          )}

          {/* Live Mockup Concept Landing Page */}
          <a
            href={`/preview/${lead._id}`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-indigo-600" />
            <span>Live Mockup Preview</span>
          </a>

          {lead.email && (
            <Link
              to={`/email-compose/${lead._id}`}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 flex items-center space-x-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send Email</span>
            </Link>
          )}

          {lead.leadStatus !== 'CONTACTED' && (
            <button
              onClick={handleMarkContacted}
              className="px-3.5 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center space-x-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Mark Contacted</span>
            </button>
          )}

          {lead.leadStatus !== 'ARCHIVED' && (
            <button
              onClick={handleArchive}
              className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Archive</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid: Details & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Business & Contact Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Attributes Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Business Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Email Address</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {lead.email || 'None provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Phone Number</span>
                <span className="font-semibold text-slate-800">
                  {lead.phone || 'None provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Address</span>
                <span className="text-slate-700">
                  {lead.address || 'None'} {lead.city ? `(${lead.city})` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Google Maps</span>
                {lead.mapsUrl ? (
                  <a
                    href={lead.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 hover:underline flex items-center space-x-1"
                  >
                    <span>View on Google Maps</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">None</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Rating & Reviews</span>
                <span className="text-slate-700">
                  {lead.rating ? `⭐ ${lead.rating} / 5` : 'No rating'}{' '}
                  {lead.reviews ? `(${lead.reviews} reviews)` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Source / Import</span>
                <span className="text-slate-700">{lead.source || 'Manual Entry'}</span>
              </div>
            </div>
          </div>

          {/* Associated Contacts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Contacts ({contacts.length})
              </h2>
              <button
                onClick={() => setShowAddContact(true)}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Contact</span>
              </button>
            </div>

            {contacts.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No individual contact persons attached to this lead yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {contacts.map((contact) => (
                  <div key={contact._id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-800">{contact.name}</span>
                        {contact.isPrimary && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-sky-100 text-sky-700">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 mt-0.5">
                        {contact.email} {contact.phone ? `• ${contact.phone}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email Outreach History with this Lead */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Outreach History ({emailHistory.length})
            </h2>
            {emailHistory.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No outreach emails sent yet.</p>
            ) : (
              <div className="space-y-3">
                {emailHistory.map((msg) => (
                  <div
                    key={msg._id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{msg.subject}</span>
                      <StatusBadge type="email" value={msg.status} />
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Sent to: {msg.recipient} on {new Date(msg.sentAt).toLocaleString()}
                    </p>
                    <div className="p-2 bg-white rounded border border-slate-100 text-slate-600 mt-1 whitespace-pre-wrap font-sans text-[11px]">
                      {msg.body}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Notes Timeline */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-sky-600" />
              <span>Notes & Timeline</span>
            </h2>

            {/* Note form */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={3}
                placeholder="Log a call, meeting, response note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newNote.trim() || addingNote}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {addingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-3 pt-2">
              {lead.notes && lead.notes.length > 0 ? (
                lead.notes.slice().reverse().map((note) => (
                  <div
                    key={note._id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1 text-xs"
                  >
                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                      <span>{note.createdBy || 'User'}</span>
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No notes recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Lead Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Edit Lead Details</h3>
            <form onSubmit={handleUpdateLead} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={editForm.businessName}
                  onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead Status</label>
                  <select
                    value={editForm.leadStatus}
                    onChange={(e) => setEditForm({ ...editForm, leadStatus: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="REPLIED">Replied</option>
                    <option value="INTERESTED">Interested</option>
                    <option value="NOT_INTERESTED">Not Interested</option>
                    <option value="CONVERTED">Converted</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Status</label>
                  <select
                    value={editForm.emailStatus}
                    onChange={(e) => setEditForm({ ...editForm, emailStatus: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="NOT_SENT">Not Sent</option>
                    <option value="SENT">Sent</option>
                    <option value="FAILED">Failed</option>
                    <option value="FOLLOW_UP_DUE">Follow-up Due</option>
                    <option value="FOLLOW_UP_SENT">Follow-up Sent</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-lg text-white font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Business Contact</h3>
            <form onSubmit={handleCreateContact} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="(555) 123-4567"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="primaryContactCheck"
                  checked={contactForm.isPrimary}
                  onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                  className="rounded text-sky-600"
                />
                <label htmlFor="primaryContactCheck" className="text-slate-700 font-medium">
                  Set as primary contact
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-lg text-white font-semibold"
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


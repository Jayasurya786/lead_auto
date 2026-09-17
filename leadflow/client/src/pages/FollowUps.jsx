import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  Send,
  Calendar,
  CheckCircle2,
  Building2,
  X,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { followUpService } from '../services/followUpService';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Review & Send Modal
  const [reviewLead, setReviewLead] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  // Reschedule Modal
  const [rescheduleLead, setRescheduleLead] = useState(null);
  const [rescheduleDays, setRescheduleDays] = useState('7');

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const res = await followUpService.getFollowUps();
      if (res.success) {
        setFollowUps(res.data);
      }
    } catch (err) {
      console.error('Error fetching follow-ups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const openReviewModal = (lead) => {
    setReviewLead(lead);
    setSubject(`Following up: Modern website for ${lead.businessName}`);
    setBody(
      `Hi ${lead.businessName},\n\nFollowing up on my note from last week regarding a website design for your business in ${lead.city || 'your area'}.\n\nWould you like to take a look at a free visual concept this week?\n\nBest regards,\n${user?.name || 'Outreach Specialist'}`
    );
  };

  const handleSendFollowUp = async () => {
    if (!reviewLead) return;
    try {
      setSending(true);
      const res = await followUpService.sendFollowUp(reviewLead._id, {
        subject,
        body,
        simulateIfNoGmail: true,
        nextDays: 7,
      });

      if (res.success) {
        setReviewLead(null);
        fetchFollowUps();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch follow-up');
    } finally {
      setSending(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleLead) return;
    try {
      const res = await followUpService.reschedule(rescheduleLead._id, {
        days: parseInt(rescheduleDays, 10),
      });
      if (res.success) {
        setRescheduleLead(null);
        fetchFollowUps();
      }
    } catch (err) {
      alert('Failed to reschedule follow-up');
    }
  };

  const isDueToday = (date) => {
    if (!date) return true;
    const d = new Date(date);
    const now = new Date();
    return d.toDateString() === now.toDateString() || d <= now;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Follow-up Management</h1>
        <p className="text-sm text-slate-500">
          Human-in-the-loop review system. Review pending follow-up messages before sending.
        </p>
      </div>

      {/* Follow-ups List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={4} />
          </div>
        ) : followUps.length === 0 ? (
          <div className="text-center py-16 px-4 text-slate-400">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-base font-bold text-slate-800">No follow-ups due right now!</p>
            <p className="text-xs text-slate-400 mt-1">
              When outreach emails reach their scheduled follow-up dates, they will appear here for your review.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {followUps.map((lead) => {
              const overdue = isDueToday(lead.nextFollowUpDate);
              return (
                <div
                  key={lead._id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/leads/${lead._id}`}
                        className="text-sm font-bold text-slate-900 hover:text-sky-600"
                      >
                        {lead.businessName}
                      </Link>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                          overdue
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {overdue ? 'Due: Today' : 'Scheduled Soon'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      {lead.category || 'Local Business'} • {lead.city || 'No City'} • Contact: {lead.email || 'No email'}
                    </p>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 pt-1">
                      <span>
                        Last Contacted:{' '}
                        {lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleDateString() : 'Never'}
                      </span>
                      <span>•</span>
                      <StatusBadge type="lead" value={lead.leadStatus} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => setRescheduleLead(lead)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Reschedule</span>
                    </button>

                    <button
                      onClick={() => openReviewModal(lead)}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 flex items-center space-x-1.5 transition-colors"
                    >
                      <span>Review & Send</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative border border-slate-200 space-y-4">
            <button
              onClick={() => setReviewLead(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
                Follow-up Review
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Review Follow-up for {reviewLead.businessName}
              </h3>
              <p className="text-xs text-slate-500">
                To: <span className="font-mono text-slate-800">{reviewLead.email}</span>
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Follow-up Message</label>
                <textarea
                  rows={6}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 leading-relaxed font-sans"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center space-x-2">
              <Clock className="h-4 w-4 text-sky-600 shrink-0" />
              <span>
                After sending, the next follow-up check will automatically advance by +7 days.
              </span>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setReviewLead(null)}
                disabled={sending}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendFollowUp}
                disabled={sending}
                className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm flex items-center space-x-2"
              >
                {sending ? (
                  <>
                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Confirm & Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 relative border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reschedule Follow-up</h3>
            <p className="text-xs text-slate-500">
              Select how many days to postpone the follow-up reminder for{' '}
              <strong>{rescheduleLead.businessName}</strong>.
            </p>

            <select
              value={rescheduleDays}
              onChange={(e) => setRescheduleDays(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="3">Postpone 3 Days</option>
              <option value="7">Postpone 1 Week (7 Days)</option>
              <option value="14">Postpone 2 Weeks (14 Days)</option>
              <option value="30">Postpone 1 Month (30 Days)</option>
            </select>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRescheduleLead(null)}
                className="px-3.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReschedule}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


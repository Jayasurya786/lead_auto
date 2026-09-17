import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Eye,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  Tag,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { leadService } from '../services/leadService';
import { templateService } from '../services/templateService';
import { gmailService } from '../services/gmailService';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import SpamScoreChecker from '../components/common/SpamScoreChecker';
import api from '../services/api';

export default function EmailCompose() {
  const { leadId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lead, setLead] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Email form state
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // AI & features state
  const [generatingAi, setGeneratingAi] = useState(false);

  // Preview state
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState({ subject: '', body: '' });

  // Send feedback
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [leadRes, tplRes] = await Promise.all([
          leadService.getLeadById(leadId),
          templateService.getTemplates(),
        ]);

        if (leadRes.success) {
          const l = leadRes.data;
          setLead(l);
          const initialTo = searchParams.get('recipient') || l.email || '';
          setTo(initialTo);

          if (tplRes.success && tplRes.data.length > 0) {
            setTemplates(tplRes.data);
            const def = tplRes.data.find((t) => t.isDefault) || tplRes.data[0];
            setSelectedTemplateId(def._id);
            setSubject(def.subject);
            setMessage(def.body);
          } else {
            // Default pitch fallback
            setSubject(`Website for ${l.businessName}`);
            setMessage(
              `Hi {{contact_name}},\n\nI noticed that {{business_name}} in {{city}} currently doesn't have an active website.\n\nI build professional websites for local businesses and would be happy to help create one for your business. Would you be interested in discussing it?\n\nRegards,\n{{sender_name}}`
            );
          }
        }
      } catch (err) {
        console.error('Error initializing compose page', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [leadId]);

  const handleTemplateSelect = (tplId) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t._id === tplId);
    if (tpl) {
      setSubject(tpl.subject);
      setMessage(tpl.body);
      if (previewMode) {
        generatePreview(tpl.subject, tpl.body);
      }
    }
  };

  const handleGenerateAiPitch = async () => {
    if (!lead) return;
    try {
      setGeneratingAi(true);
      setStatusMessage(null);
      const res = await api.post('/ai/pitch', { leadId: lead._id });
      if (res.data.success && res.data.data) {
        setSubject(res.data.data.subject || subject);
        setMessage(res.data.data.body || message);
        setStatusMessage({
          type: 'success',
          text: `✨ Pitch generated using ${res.data.data.aiModel || 'Gemini Flash AI'}! Feel free to review or tweak before sending.`,
        });
      }
    } catch (err) {
      console.error('Failed to generate AI pitch:', err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to generate AI pitch.',
      });
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleInsertMockupLink = () => {
    if (!lead) return;
    const mockupUrl = `${window.location.origin}/preview/${lead._id}`;
    const mockupSnippet = `\n\nI even put together a live modern concept mockup of how your business website could look:\n👉 ${mockupUrl}\n\nFeel free to explore it on your phone or computer.`;
    setMessage((prev) => `${prev}${mockupSnippet}`);
  };

  const handleOpenGmailWeb = () => {
    const vars = {
      business_name: lead?.businessName || 'Business',
      contact_name: lead?.contacts?.[0]?.name || lead?.businessName || 'Business Owner',
      category: lead?.category || 'Local Business',
      city: lead?.city || 'your area',
      sender_name: user?.name || 'Outreach Specialist',
    };

    const finalSubject = subject.replace(/{{\s*([\w_]+)\s*}}/g, (_, k) => vars[k] || '');
    const finalBody = message.replace(/{{\s*([\w_]+)\s*}}/g, (_, k) => vars[k] || '');

    const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      to
    )}&su=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
    window.open(gmailWebUrl, '_blank');
  };

  const insertVariable = (varTag) => {
    setMessage((prev) => `${prev} {{${varTag}}}`);
  };

  const generatePreview = (subj = subject, bdy = message) => {
    const vars = {
      business_name: lead?.businessName || 'Business',
      contact_name: lead?.contacts?.[0]?.name || lead?.businessName || 'Business Owner',
      category: lead?.category || 'Local Business',
      city: lead?.city || 'your area',
      sender_name: user?.name || 'Outreach Specialist',
    };

    const interp = (str) =>
      str.replace(/{{\s*([\w_]+)\s*}}/g, (match, key) => (vars[key] !== undefined ? vars[key] : match));

    setPreviewData({
      subject: interp(subj),
      body: interp(bdy),
    });
  };

  const togglePreview = () => {
    if (!previewMode) {
      generatePreview();
    }
    setPreviewMode(!previewMode);
  };

  const handleSaveDraft = () => {
    localStorage.setItem(
      `leadflow_draft_${leadId}`,
      JSON.stringify({ to, subject, message, savedAt: new Date() })
    );
    setStatusMessage({
      type: 'info',
      text: 'Draft saved locally.',
    });
  };

  const handleSend = async () => {
    if (!to || !to.includes('@')) {
      alert('Please specify a valid recipient email address.');
      return;
    }

    try {
      setSending(true);
      setStatusMessage(null);

      // Interpolate content before sending
      const vars = {
        business_name: lead?.businessName || 'Business',
        contact_name: lead?.businessName || 'Business Owner',
        category: lead?.category || 'Local Business',
        city: lead?.city || 'your area',
        sender_name: user?.name || 'Outreach Specialist',
      };

      const finalSubject = subject.replace(/{{\s*([\w_]+)\s*}}/g, (_, k) => vars[k] || '');
      const finalBody = message.replace(/{{\s*([\w_]+)\s*}}/g, (_, k) => vars[k] || '');

      const res = await gmailService.sendEmail({
        leadId: lead._id,
        recipient: to,
        subject: finalSubject,
        body: finalBody,
        simulateIfNoGmail: true,
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text:
            res.data?.mode === 'SIMULATED'
              ? 'Outreach email simulated successfully (Connect Gmail in Settings for live sending).'
              : 'Email sent successfully through Gmail!',
        });

        // Navigate to lead details after short delay
        setTimeout(() => {
          navigate(`/leads/${lead._id}`);
        }, 1500);
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to send email.',
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">Lead not found</p>
        <Link to="/leads" className="text-xs font-semibold text-sky-600 mt-2 inline-block">
          Return to Leads
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to={`/leads/${lead._id}`}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 space-x-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {lead.businessName}</span>
        </Link>
        <span className="text-xs text-slate-400">
          Target: <strong>{lead.businessName}</strong> ({lead.city || 'No city'})
        </span>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center space-x-2 animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-sky-50 text-sky-800 border border-sky-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Composer Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Template Selector & Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-700">Template:</span>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="text-xs py-1.5 px-2 bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {templates.map((tpl) => (
                  <option key={tpl._id} value={tpl._id}>
                    {tpl.name} {tpl.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Pitch Button */}
            <button
              type="button"
              onClick={handleGenerateAiPitch}
              disabled={generatingAi}
              className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              title="Generate customized pitch using Gemini AI"
            >
              <Sparkles className={`h-3.5 w-3.5 text-purple-600 ${generatingAi ? 'animate-spin' : ''}`} />
              <span>{generatingAi ? 'Generating Pitch...' : '✨ AI Pitch (Gemini)'}</span>
            </button>

            {/* Insert Mockup Preview Link */}
            <button
              type="button"
              onClick={handleInsertMockupLink}
              className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg flex items-center space-x-1.5 transition-colors"
              title="Insert a link to the live mockup preview for this business"
            >
              <ExternalLink className="h-3.5 w-3.5 text-teal-600" />
              <span>🖥️ Insert Concept Preview</span>
            </button>
          </div>

          {/* Live Preview Toggle */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={togglePreview}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center space-x-1.5 ${
                previewMode
                  ? 'bg-sky-50 text-sky-700 border-sky-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{previewMode ? 'Edit Draft' : 'Preview Personalized'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Personalization Variables Bar */}
        {!previewMode && (
          <div className="px-6 py-2.5 bg-slate-100/60 border-b border-slate-200/60 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
              <Tag className="h-3 w-3" />
              <span>Insert Variable:</span>
            </span>
            {['business_name', 'contact_name', 'category', 'city', 'sender_name'].map((varTag) => (
              <button
                key={varTag}
                type="button"
                onClick={() => insertVariable(varTag)}
                className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-white hover:bg-sky-50 text-sky-700 border border-slate-200 rounded transition-colors"
              >
                {`{{${varTag}}}`}
              </button>
            ))}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {!previewMode ? (
            <>
              {/* To field */}
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-3 text-xs">
                <label className="font-semibold text-slate-500 w-16">To:</label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="flex-1 font-mono text-slate-900 focus:outline-none"
                  required
                />
              </div>

              {/* Subject field */}
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-3 text-xs">
                <label className="font-semibold text-slate-500 w-16">Subject:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Website for {{business_name}}"
                  className="flex-1 text-slate-900 font-semibold focus:outline-none"
                  required
                />
              </div>

              {/* Message field */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500">Message:</label>
                <textarea
                  rows={10}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your outreach email here..."
                  className="w-full text-xs p-3 font-sans border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed"
                  required
                />
              </div>

              {/* Spam Score Checker */}
              <div className="pt-1">
                <SpamScoreChecker subject={subject} body={message} />
              </div>
            </>
          ) : (
            /* Live Personalized Preview Screen */
            <div className="p-6 bg-slate-50/70 rounded-xl border border-slate-200 space-y-4 animate-fadeIn">
              <div className="border-b border-slate-200 pb-3 text-xs space-y-1">
                <p className="text-slate-500">
                  <strong>To:</strong> <span className="font-mono text-slate-800">{to}</span>
                </p>
                <p className="text-slate-500">
                  <strong>Subject:</strong>{' '}
                  <span className="font-bold text-slate-900">{previewData.subject}</span>
                </p>
              </div>
              <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {previewData.body}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg flex items-center justify-center space-x-1.5 transition-colors order-2 sm:order-1"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Draft</span>
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
            <Link
              to={`/leads/${lead._id}`}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg text-center transition-colors"
            >
              Cancel
            </Link>

            {/* 1-Click Open in Gmail Web (Zero OAuth / No setup needed!) */}
            <button
              type="button"
              onClick={handleOpenGmailWeb}
              disabled={!to}
              className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
              title="Open draft directly in your personal Gmail browser tab (Zero OAuth / No setup needed)"
            >
              <ExternalLink className="h-3.5 w-3.5 text-rose-600" />
              <span>Open in Gmail Web</span>
            </button>

            {/* Direct Backend Outreach Dispatch */}
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !to}
              className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg shadow-sm shadow-sky-600/20 flex items-center justify-center space-x-2 transition-all"
            >
              {sending ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Dispatching Email...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Outreach Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


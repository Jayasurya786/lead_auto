import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  Eye,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoveRight,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const STAGES = [
  { id: 'NEW', title: 'New Leads', color: 'border-blue-300 bg-blue-50/40 text-blue-800' },
  { id: 'CONTACTED', title: 'Contacted', color: 'border-purple-300 bg-purple-50/40 text-purple-800' },
  { id: 'REPLIED', title: 'Replied 🔥', color: 'border-emerald-300 bg-emerald-50/40 text-emerald-800' },
  { id: 'INTERESTED', title: 'Interested 🎯', color: 'border-green-400 bg-green-50/60 text-green-800' },
  { id: 'CONVERTED', title: 'Converted 🏆', color: 'border-amber-400 bg-amber-50/60 text-amber-800' },
  { id: 'NOT_INTERESTED', title: 'Not Interested', color: 'border-slate-300 bg-slate-50/40 text-slate-700' },
];

export default function KanbanBoard({ leads, onUpdateLeadStatus }) {
  const [draggedLeadId, setDraggedLeadId] = useState(null);

  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('leadId', leadId);
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStageId) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId') || draggedLeadId;
    if (leadId && targetStageId) {
      onUpdateLeadStatus(leadId, targetStageId);
    }
    setDraggedLeadId(null);
  };

  // Group leads by status
  const columns = {};
  STAGES.forEach((s) => (columns[s.id] = []));
  leads.forEach((l) => {
    const st = l.leadStatus || 'NEW';
    if (columns[st]) {
      columns[st].push(l);
    } else {
      columns['NEW'].push(l);
    }
  });

  const getWhatsAppUrl = (lead) => {
    const rawDigits = (lead.phone || '').replace(/\D/g, '');
    const cleanPhone = rawDigits.startsWith('1') || rawDigits.startsWith('91') ? rawDigits : `1${rawDigits}`;
    const text = encodeURIComponent(
      `Hi, I noticed ${lead.businessName} in ${lead.city || 'your city'} doesn't have an active website. I build modern websites for local businesses and would be happy to share a free 1-minute visual concept. Are you open to seeing it?`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <div className="overflow-x-auto pb-6 overscroll-x-contain scroll-smooth touch-pan-x">
      <div className="flex space-x-4 min-w-[1200px]">
        {STAGES.map((stage) => {
          const items = columns[stage.id] || [];
          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              className="flex-1 bg-slate-100/70 rounded-2xl p-3 border border-slate-200/80 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-2 mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <span>{stage.title}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white border border-slate-200 text-slate-600 font-extrabold">
                    {items.length}
                  </span>
                </span>
              </div>

              {/* Cards list */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
                {items.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                    Drop here
                  </div>
                ) : (
                  items.map((lead) => (
                    <div
                      key={lead._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead._id)}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-2.5 group"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <Link
                          to={`/leads/${lead._id}`}
                          className="font-bold text-xs text-slate-900 hover:text-sky-600 truncate block flex-1"
                        >
                          {lead.businessName}
                        </Link>
                        {lead.rating && (
                          <span className="text-[10px] font-bold text-amber-600 flex items-center shrink-0">
                            ⭐ {lead.rating}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 truncate">
                        {lead.category || 'Local Business'} • {lead.city || 'No City'}
                      </p>

                      <div className="flex items-center space-x-2 pt-1">
                        <StatusBadge type="email" value={lead.emailStatus} />
                      </div>

                      {/* Card Action footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                        <div className="flex items-center space-x-2">
                          {lead.phone && (
                            <a
                              href={getWhatsAppUrl(lead)}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat on WhatsApp"
                              className="text-emerald-600 hover:text-emerald-700 p-1 hover:bg-emerald-50 rounded"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {lead.email && (
                            <Link
                              to={`/email-compose/${lead._id}`}
                              title="Send Email"
                              className="text-sky-600 hover:text-sky-700 p-1 hover:bg-sky-50 rounded"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </Link>
                          )}
                          <Link
                            to={`/preview/${lead._id}`}
                            target="_blank"
                            title="Live Mockup Preview"
                            className="text-purple-600 hover:text-purple-700 p-1 hover:bg-purple-50 rounded"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>

                        {/* Quick stage selector */}
                        <select
                          value={lead.leadStatus}
                          onChange={(e) => onUpdateLeadStatus(lead._id, e.target.value)}
                          className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700"
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              Move: {s.id}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


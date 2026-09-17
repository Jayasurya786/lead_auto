import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Sparkles,
  Mail,
  Send,
  MessageSquare,
  Clock,
  ArrowRight,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { leadService } from '../services/leadService';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import StatusBadge from '../components/common/StatusBadge';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const res = await leadService.getStats();
        if (res.success) {
          setStats(res.stats);
          setRecentActivity(res.recentActivity);
        }
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  const statCards = [
    {
      title: 'TOTAL BUSINESSES',
      value: stats?.totalBusinesses ?? 0,
      icon: Building2,
      color: 'text-slate-600 bg-slate-100',
      border: 'border-slate-200',
      description: 'All parsed records from uploads',
      link: '/imports',
    },
    {
      title: 'NO WEBSITE LEADS',
      value: stats?.totalLeads ?? 0,
      icon: Sparkles,
      color: 'text-sky-600 bg-sky-50',
      border: 'border-sky-200 ring-1 ring-sky-100',
      description: 'Qualified businesses without websites',
      link: '/leads',
    },
    {
      title: 'NEW LEADS',
      value: stats?.newLeads ?? 0,
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
      border: 'border-blue-200',
      description: 'Awaiting first cold outreach',
      link: '/leads?leadStatus=NEW',
    },
    {
      title: 'EMAILS AVAILABLE',
      value: stats?.emailsAvailable ?? 0,
      icon: Mail,
      color: 'text-indigo-600 bg-indigo-50',
      border: 'border-indigo-200',
      description: 'Leads with verified contact emails',
      link: '/leads?hasEmail=true',
    },
    {
      title: 'EMAILS SENT',
      value: stats?.emailsSent ?? 0,
      icon: Send,
      color: 'text-emerald-600 bg-emerald-50',
      border: 'border-emerald-200',
      description: 'Cold outreach emails dispatched',
      link: '/email-history',
    },
    {
      title: 'EMAILS OPENED',
      value: stats?.emailsOpened ?? 0,
      icon: Eye,
      color: 'text-teal-600 bg-teal-50',
      border: 'border-teal-200',
      description: 'Emails read by prospects (pixel tracking)',
      link: '/email-history',
    },
    {
      title: 'REPLIES',
      value: stats?.replies ?? 0,
      icon: MessageSquare,
      color: 'text-purple-600 bg-purple-50',
      border: 'border-purple-200',
      description: 'Leads actively engaged in discussions',
      link: '/leads?leadStatus=REPLIED',
    },
    {
      title: 'FOLLOW-UPS DUE',
      value: stats?.followUpsDue ?? 0,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
      border: 'border-amber-200',
      description: 'Requires follow-up review & dispatch',
      link: '/follow-ups',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Local business lead pipeline, website gap detection, and cold outreach tracking.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/upload"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-sky-600/20 transition-colors"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload XLSX</span>
          </Link>
          <Link
            to="/leads"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>View Leads</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.link}
              className={`bg-white p-5 rounded-xl border ${card.border} shadow-sm hover:shadow-md transition-all group flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {card.value.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1">{card.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-sky-600 group-hover:text-sky-700">
                <span>View Details</span>
                <ArrowRight className="h-3 w-3 ml-1 transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Leads without Websites */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-sky-600" />
              <span>Recently Discovered Leads</span>
            </h2>
            <Link to="/leads" className="text-xs font-semibold text-sky-600 hover:text-sky-700">
              View All
            </Link>
          </div>

          {recentActivity?.leads && recentActivity.leads.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentActivity.leads.map((lead) => (
                <div key={lead._id} className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
                  <div className="truncate mr-3">
                    <Link
                      to={`/leads/${lead._id}`}
                      className="text-sm font-semibold text-slate-800 hover:text-sky-600 truncate block"
                    >
                      {lead.businessName}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {lead.category || 'Local Business'} • {lead.city || 'No City'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <StatusBadge type="lead" value={lead.leadStatus} />
                    <Link
                      to={`/email-compose/${lead._id}`}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded"
                      title="Compose Outreach Email"
                    >
                      <Mail className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No leads yet. Upload a business spreadsheet to begin!
            </div>
          )}
        </div>

        {/* Latest Email Outreach Dispatches */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Send className="h-4 w-4 text-emerald-600" />
              <span>Recent Email Outreach</span>
            </h2>
            <Link to="/email-history" className="text-xs font-semibold text-sky-600 hover:text-sky-700">
              View All
            </Link>
          </div>

          {recentActivity?.emails && recentActivity.emails.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentActivity.emails.map((email) => (
                <div key={email._id} className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
                  <div className="truncate mr-3">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {email.subject}
                    </p>
                    <p className="text-xs text-slate-400">
                      To: {email.recipient} • {email.leadId?.businessName || 'Lead'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge type="email" value={email.status} />
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {new Date(email.sentAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No emails sent yet. Start cold outreach from the Leads tab.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


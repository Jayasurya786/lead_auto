import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, Search, Mail, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { gmailService } from '../../services/gmailService';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Topbar({ setMobileOpen }) {
  const [gmailStatus, setGmailStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [syncingReplies, setSyncingReplies] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSyncReplies = async () => {
    try {
      setSyncingReplies(true);
      const res = await api.post('/gmail/sync-replies');
      if (res.data.success) {
        toast.success(res.data.message || `Checked inbox: ${res.data.data?.newRepliesFound || 0} replies found`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sync replies');
    } finally {
      setSyncingReplies(false);
    }
  };

  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await gmailService.getStatus();
      if (res.success) {
        setGmailStatus(res.data);
      }
    } catch (err) {
      console.warn('Failed to load Gmail status in topbar');
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh status periodically
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/leads?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left side: Hamburger & Global Search */}
      <div className="flex items-center space-x-3 flex-1 max-w-xl">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, businesses, cities, emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-800"
          />
        </form>
      </div>

      {/* Right side: Gmail status & Profile */}
      <div className="flex items-center space-x-3">
        {/* Outreach / Email Status Pill */}
        <Link
          to="/settings"
          title="Click to view outreach settings"
          className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-colors"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="hidden md:inline truncate max-w-[140px]">
            {gmailStatus?.email || 'Outreach Ready'}
          </span>
          <span className="md:hidden">Ready</span>
        </Link>

        {/* 1-Click Sync Replies Button */}
        {gmailStatus?.connected && (
          <button
            type="button"
            onClick={handleSyncReplies}
            disabled={syncingReplies}
            title="Scan Gmail inbox for prospect replies"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-sky-600 ${syncingReplies ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{syncingReplies ? 'Syncing...' : 'Sync Replies'}</span>
          </button>
        )}

        {/* User avatar indicator */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <span className="text-xs font-semibold text-slate-700 hidden lg:inline">
            {user?.name}
          </span>
        </div>
      </div>
    </header>
  );
}


import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Mail,
  CheckCircle2,
  AlertCircle,
  Shield,
  Sliders,
  ExternalLink,
  Info,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { gmailService } from '../services/gmailService';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const [searchParams] = useSearchParams();
  const { user, updateUser } = useAuth();

  const [gmailStatus, setGmailStatus] = useState(null);
  const [loadingGmail, setLoadingGmail] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Daily limit
  const [dailyLimit, setDailyLimit] = useState(user?.dailyEmailLimit || 50);
  const [savingLimit, setSavingLimit] = useState(false);
  const [limitNotice, setLimitNotice] = useState('');

  // Status banner from OAuth redirect
  const [oauthNotice, setOauthNotice] = useState(null);

  const fetchStatus = async () => {
    try {
      setLoadingGmail(true);
      const res = await gmailService.getStatus();
      if (res.success) {
        setGmailStatus(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch Gmail status', err);
    } finally {
      setLoadingGmail(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    const statusParam = searchParams.get('gmail');
    const msgParam = searchParams.get('msg');
    if (statusParam === 'success') {
      setOauthNotice({
        type: 'success',
        text: 'Gmail account connected successfully! You can now send cold outreach emails directly from your verified Gmail address.',
      });
    } else if (statusParam === 'error') {
      setOauthNotice({
        type: 'error',
        text: `OAuth error: ${msgParam || 'Authentication was cancelled or failed.'}`,
      });
    }
  }, [searchParams]);

  const handleConnectGmail = async () => {
    try {
      setConnecting(true);
      const res = await gmailService.getAuthUrl();
      if (res.success && res.authUrl) {
        window.location.href = res.authUrl;
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
          'Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are not configured in server/.env yet.'
      );
      setConnecting(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (window.confirm('Are you sure you want to disconnect your Gmail account?')) {
      try {
        setDisconnecting(true);
        await gmailService.disconnect();
        fetchStatus();
      } catch (err) {
        alert('Failed to disconnect Gmail');
      } finally {
        setDisconnecting(false);
      }
    }
  };

  const handleSaveLimit = async (e) => {
    e.preventDefault();
    try {
      setSavingLimit(true);
      setLimitNotice('');
      const res = await authService.updateProfile({ dailyEmailLimit: dailyLimit });
      if (res.success) {
        updateUser({ dailyEmailLimit: res.user.dailyEmailLimit });
        setLimitNotice('Daily limit updated successfully.');
      }
    } catch (err) {
      setLimitNotice('Failed to update limit.');
    } finally {
      setSavingLimit(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure Google Gmail OAuth 2.0 connection, outreach safety limits, and security credentials.
        </p>
      </div>

      {oauthNotice && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center space-x-2 animate-fadeIn ${
            oauthNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {oauthNotice.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{oauthNotice.text}</span>
        </div>
      )}

      {/* Gmail Integration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Gmail Outreach Integration</h2>
              <p className="text-xs text-slate-500">
                Connect your personal or business Gmail account via official Google OAuth 2.0.
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
              gmailStatus?.connected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {gmailStatus?.connected ? 'Connected' : 'Not Connected'}
          </span>
        </div>

        {/* Integration Status Details */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-slate-500 block">Outreach Mode:</span>
              <span className="font-semibold text-slate-800 text-sm">
                {gmailStatus?.connected
                  ? `Active (${gmailStatus.provider || 'Ready'}: ${gmailStatus.email})`
                  : 'Simulation & Webmail Mode Active (Zero Setup Needed)'}
              </span>
            </div>

            <div>
              {gmailStatus?.connected && gmailStatus.provider === 'GOOGLE_OAUTH' && (
                <button
                  type="button"
                  onClick={handleDisconnectGmail}
                  disabled={disconnecting}
                  className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                >
                  {disconnecting ? 'Disconnecting...' : 'Disconnect OAuth'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3 Simple Ways to Send Outreach (Zero OAuth Barrier) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200/80 text-xs space-y-1.5">
            <span className="font-bold text-rose-800 flex items-center space-x-1">
              <span>🚀 1-Click Gmail Web Compose</span>
            </span>
            <p className="text-rose-700/80 text-[11px] leading-relaxed">
              In Email Compose, click <strong>"Open in Gmail Web"</strong>. It launches your personal Gmail in the browser with recipient, subject, and customized pitch ready to send immediately. <em>Zero setup required!</em>
            </p>
          </div>

          <div className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-200/80 text-xs space-y-1.5">
            <span className="font-bold text-sky-800 flex items-center space-x-1">
              <span>⚡ Direct SMTP / App Password</span>
            </span>
            <p className="text-sky-700/80 text-[11px] leading-relaxed">
              No Google Cloud Project or OAuth keys required! Add your email and a 16-letter App Password to <code>server/.env</code> (<code>SMTP_USER</code> & <code>SMTP_PASS</code>) to send live emails automatically.
            </p>
          </div>

          <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/80 text-xs space-y-1.5">
            <span className="font-bold text-emerald-800 flex items-center space-x-1">
              <span>📊 Built-in Simulator Mode</span>
            </span>
            <p className="text-emerald-700/80 text-[11px] leading-relaxed">
              Default mode logs every outreach message, updates pipeline stages, triggers follow-up reminders, and tracks open/click metrics with zero configuration.
            </p>
          </div>
        </div>
      </div>

      {/* Daily Email Quota & Safety Limits */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Daily Outreach Safety Limit</h2>
            <p className="text-xs text-slate-500">
              Set maximum cold emails allowed per 24 hours to protect your domain reputation.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveLimit} className="space-y-4 max-w-sm text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Daily Limit (Emails per Day)
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-900 font-semibold"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Google free accounts have standard daily sending quotas. Recommended: 30-50/day.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={savingLimit}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-sm"
            >
              {savingLimit ? 'Saving...' : 'Update Limit'}
            </button>
            {limitNotice && <span className="text-xs text-emerald-600 font-medium">{limitNotice}</span>}
          </div>
        </form>
      </div>

      {/* Developer Setup Instructions for Free Tier */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
          <Info className="h-4 w-4 text-sky-600" />
          <span>Configuring Google Cloud Console (₹0 Free Tier)</span>
        </h3>
        <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
          <li>
            Open{' '}
            <a
              href="https://console.cloud.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-sky-600 hover:underline inline-flex items-center space-x-0.5"
            >
              <span>Google Cloud Console</span>
              <ExternalLink className="h-3 w-3 inline ml-0.5" />
            </a>{' '}
            and create a new project called <code>LeadFlow</code>.
          </li>
          <li>
            Navigate to <strong>APIs & Services &gt; Library</strong> and enable <strong>Gmail API</strong>.
          </li>
          <li>
            Go to <strong>OAuth consent screen</strong>, select <strong>External</strong>, and add scopes <code>https://www.googleapis.com/auth/gmail.send</code> and <code>https://www.googleapis.com/auth/userinfo.email</code>.
          </li>
          <li>
            Go to <strong>Credentials &gt; Create Credentials &gt; OAuth client ID</strong>, choose <strong>Web application</strong>, and set Authorized redirect URIs to <code>http://localhost:5000/api/gmail/callback</code>.
          </li>
          <li>
            Copy <code>Client ID</code> and <code>Client Secret</code> into <code>server/.env</code>.
          </li>
        </ol>
      </div>
    </div>
  );
}


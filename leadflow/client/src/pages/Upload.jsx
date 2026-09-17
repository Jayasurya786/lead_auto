import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Info,
  Sparkles,
} from 'lucide-react';
import { importService } from '../services/importService';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile) => {
    setError('');
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setError('Please select a valid spreadsheet file (.xlsx, .xls, or .csv).');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10 MB limit.');
      return;
    }

    setFile(selectedFile);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please choose a file to analyze.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await importService.uploadFile(file);
      if (res.success) {
        setStats(res.stats);
      } else {
        setError(res.message || 'Failed to process file.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(
        err.response?.data?.message || 'Error processing spreadsheet upload.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setStats(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Upload Businesses</h1>
        <p className="text-sm text-slate-500 mt-1">
          Import local business records from Excel or CSV files. LeadFlow will automatically detect
          businesses missing an active website and qualify them as new outreach leads.
        </p>
      </div>

      {/* Upload Box / Results Display */}
      {!stats ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-sky-500 bg-sky-50/50'
                : 'border-slate-300 hover:border-sky-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="mx-auto h-16 w-16 rounded-full bg-sky-100/80 text-sky-600 flex items-center justify-center mb-4 shadow-inner">
              <UploadCloud className="h-8 w-8" />
            </div>

            {file ? (
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB • Ready for analysis
                </p>
                <p className="text-xs text-sky-600 underline pt-2">Click to choose a different file</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-base font-medium text-slate-700">
                  <span className="font-semibold text-sky-600">Choose XLSX</span> or drag & drop here
                </p>
                <p className="text-xs text-slate-400">Supports .xlsx, .xls, and .csv up to 10 MB</p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <a
              href="/sample_businesses.xlsx"
              download="sample_businesses.xlsx"
              onClick={(e) => {
                // If static file isn't in public, fetch directly from sample_data or provide helpful notice
              }}
              className="text-xs font-semibold text-slate-600 hover:text-sky-600 flex items-center space-x-1.5"
            >
              <Info className="h-4 w-4 text-slate-400" />
              <span>Variations handled: Business Name, Category, Phone, Email, Maps URL, Rating</span>
            </a>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              {file && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!file || loading}
                className="w-full sm:w-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-sm shadow-sky-600/20 transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing File...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Analyze File</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Import Complete Result Card */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 text-emerald-600 pb-4 border-b border-slate-100">
            <CheckCircle2 className="h-8 w-8 shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Import Complete</h2>
              <p className="text-xs text-slate-500">File: {stats.fileName}</p>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Rows
              </span>
              <span className="text-2xl font-bold text-slate-800 mt-1 block">
                {stats.totalRows.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                With Website
              </span>
              <span className="text-2xl font-bold text-slate-600 mt-1 block">
                {stats.websitesFound.toLocaleString()}
              </span>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">
                No Website
              </span>
              <span className="text-2xl font-bold text-amber-800 mt-1 block">
                {stats.noWebsite.toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Duplicates
              </span>
              <span className="text-2xl font-bold text-slate-500 mt-1 block">
                {stats.duplicates.toLocaleString()}
              </span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center col-span-2 sm:col-span-1 ring-2 ring-emerald-400">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                New Leads
              </span>
              <span className="text-3xl font-black text-emerald-700 mt-1 block">
                {stats.newLeads.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Explanation note */}
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 leading-relaxed">
            <strong>Filtering logic applied:</strong> Businesses with existing websites were recorded
            without generating new leads. Values like empty strings, <code>N/A</code>, <code>none</code>, or Google Maps URLs were identified as <em>No Website</em> and saved as new qualified leads in MongoDB with full duplicate protection.
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={resetForm}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Upload Another File
            </button>
            <button
              onClick={() => navigate('/leads')}
              className="w-full sm:w-auto px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 transition-all flex items-center justify-center space-x-2"
            >
              <span>View Qualified Leads</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Rules Information Card */}
      <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
          <Info className="h-4 w-4 text-sky-600" />
          <span>Website Detection & Deduplication Rules</span>
        </h3>
        <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
          <li>
            <strong>Website Filtering:</strong> Values recognized as no website include empty cells,{' '}
            <code>-</code>, <code>N/A</code>, <code>NA</code>, <code>none</code>, and <code>not available</code>.
          </li>
          <li>
            <strong>Google Maps Separation:</strong> If a Google Maps URL is found in the website column, it is extracted to Maps URL and the business is correctly qualified as a lead.
          </li>
          <li>
            <strong>Multi-Signal Duplicate Prevention:</strong> Compares normalized business name, phone digits, email, and city so you never send duplicate pitches.
          </li>
        </ul>
      </div>
    </div>
  );
}


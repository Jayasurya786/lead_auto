import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, UploadCloud, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { importService } from '../services/importService';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

export default function Imports() {
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await importService.getImports();
        if (res.success) {
          setImports(res.data);
        }
      } catch (err) {
        console.error('Error fetching imports', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Import History</h1>
          <p className="text-sm text-slate-500">
            Log of all uploaded business spreadsheets, parsed website gap metrics, and deduplication stats.
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload New File</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={4} />
          </div>
        ) : imports.length === 0 ? (
          <div className="text-center py-16 px-4 text-slate-400">
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-700">No spreadsheets imported yet</p>
            <Link to="/upload" className="mt-2 text-xs font-semibold text-sky-600 inline-block">
              Upload your first XLSX file
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">File Name</th>
                  <th className="p-3.5">Import Date</th>
                  <th className="p-3.5 text-right">Total Rows</th>
                  <th className="p-3.5 text-right">Websites Found</th>
                  <th className="p-3.5 text-right">No Website</th>
                  <th className="p-3.5 text-right">Duplicates</th>
                  <th className="p-3.5 text-right font-bold text-slate-800">New Leads</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {imports.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-semibold text-slate-900 flex items-center space-x-2">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{item.fileName}</span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-800">
                      {item.totalRows.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-500">
                      {item.websitesFound.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right font-mono text-amber-700 font-semibold">
                      {item.noWebsite.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-400">
                      {item.duplicates.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-600 text-sm">
                      {item.newLeads.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.status === 'PROCESSING'
                            ? 'bg-sky-50 text-sky-700 border-sky-200 animate-pulse'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


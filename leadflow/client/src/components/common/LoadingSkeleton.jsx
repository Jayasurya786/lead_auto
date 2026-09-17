import React from 'react';

export default function LoadingSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full animate-pulse space-y-4">
      {/* Header bar placeholder */}
      <div className="h-10 bg-slate-200/70 rounded-lg w-full mb-6"></div>

      {/* Row placeholders */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-slate-200/60 shadow-sm">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/6"></div>
          <div className="h-4 bg-slate-200 rounded w-1/5"></div>
          <div className="h-4 bg-slate-200 rounded w-1/6"></div>
          <div className="h-6 bg-slate-200 rounded-full w-20 ml-auto"></div>
        </div>
      ))}
    </div>
  );
}


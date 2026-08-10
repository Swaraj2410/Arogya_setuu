import React from 'react';
import clsx from 'clsx';

export function LoadingSpinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
      {label}
    </div>
  );
}

export function SkeletonCard({ className }) {
  return (
    <div className={clsx('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}>
      <div className="h-4 w-32 rounded bg-slate-100" />
      <div className="mt-4 h-8 w-44 rounded bg-slate-100" />
      <div className="mt-4 space-y-2">
        <div className="h-3 rounded bg-slate-100" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
      </div>
    </div>
  );
}

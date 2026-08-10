import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function StatCard({ label, value, delta, icon: Icon, color = 'bg-brand-50 text-brand-700' }) {
  return (
    <div className="flex min-h-[112px] flex-1 items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-card">
      <div>
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
        {delta && (
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <ArrowUpRight size={14} />
            {delta}
          </p>
        )}
      </div>
      <span className={`flex h-11 w-11 items-center justify-center rounded-md ${color}`}>
        {Icon && <Icon size={22} />}
      </span>
    </div>
  );
}

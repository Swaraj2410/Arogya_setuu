import React from 'react';
import clsx from 'clsx';

const colors = {
  booked: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  completed: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  cancelled: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  warm: 'bg-earth-50 text-earth-600 ring-1 ring-earth-100',
  subtle: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
};

export default function Badge({ label, variant = 'booked' }) {
  return <span className={clsx('rounded-md px-2.5 py-1 text-xs font-semibold', colors[variant] || colors.subtle)}>{label}</span>;
}

import React from 'react';
import { Sprout } from 'lucide-react';

export default function EmptyState({ icon: Icon = Sprout, title, text, action }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-6 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-field-50 text-field-700">
        <Icon size={22} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
      {text && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

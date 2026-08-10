import React from 'react';
import clsx from 'clsx';

export default function SectionCard({ title, action, children, className }) {
  return (
    <section className={clsx('w-full rounded-lg border border-slate-200 bg-white p-4 shadow-card', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

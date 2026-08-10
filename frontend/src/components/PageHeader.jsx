import React from 'react';

export default function PageHeader({ eyebrow, title, text, action, meta }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="text-sm font-semibold text-brand-700">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-2xl font-semibold text-slate-950 md:text-3xl">{title}</h1>
        {text && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{text}</p>}
        {meta && <div className="mt-3">{meta}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

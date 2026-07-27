import React from 'react';
import { HeartPulse } from 'lucide-react';

export default function Brand() {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
        <HeartPulse />
      </span>
      <div>
        <p className="font-display text-lg leading-none">Arogya Rural</p>
        <p className="text-xs text-slate-500 leading-none">Rural doctor scheduling</p>
      </div>
    </div>
  );
}

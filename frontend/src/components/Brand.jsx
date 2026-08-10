import React from 'react';
import { HeartPulse, MapPin } from 'lucide-react';

export default function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-700 text-white">
        <MapPin size={24} aria-hidden="true" />
        <HeartPulse size={13} className="absolute" aria-hidden="true" />
      </span>
      {!compact && (
        <div>
          <p className="font-display text-lg font-semibold leading-none text-slate-950">Arogya Rural</p>
          <p className="text-xs leading-none text-slate-500">Healthcare closer to every village</p>
        </div>
      )}
    </div>
  );
}

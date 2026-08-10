import React from 'react';
import { Languages } from 'lucide-react';
import { useLocale } from '../state/LocaleContext';

export default function LanguageSelector({ compact = false }) {
  const { language, languages, setLanguage } = useLocale();

  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
      {!compact && <Languages size={17} className="text-brand-700" aria-hidden="true" />}
      <span className={compact ? 'sr-only' : ''}>Language</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-800"
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

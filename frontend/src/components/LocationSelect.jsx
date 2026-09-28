import React, { useEffect, useState } from 'react';
import { fetchDistricts, fetchStates, fetchTalukas, fetchVillages } from '../api/locations';

const defaultInputClassName =
  'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm focus:border-brand-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400';
const emptyLocation = { state: '', district: '', taluka: '', village: '' };
const fields = ['state', 'district', 'taluka', 'village'];

// Associate results with their parent so old responses cannot populate a new selection.
function useLocationOptions(fetchOptions, parentCode) {
  const [result, setResult] = useState({ parentCode: null, options: [], loading: false, error: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (parentCode == null) return;
    let active = true;
    setResult({ parentCode, options: [], loading: true, error: false });
    fetchOptions(parentCode)
      .then((options) => {
        if (active) setResult({ parentCode, options, loading: false, error: false });
      })
      .catch(() => {
        if (active) setResult({ parentCode, options: [], loading: false, error: true });
      });
    return () => { active = false; };
  }, [fetchOptions, parentCode, attempt]);

  const current = parentCode != null && result.parentCode === parentCode
    ? result
    : { options: [], loading: parentCode != null, error: false };
  return { ...current, retry: () => setAttempt((value) => value + 1) };
}

const selectedOption = (options, name) => options.find((option) => option.name === name);

export default function LocationSelect({
  value = emptyLocation,
  onChange,
  required = false,
  inputClassName = defaultInputClassName,
  labelClassName = 'text-sm text-slate-600'
}) {
  // Resolve persisted names back to dataset codes when a form step is revisited.
  const states = useLocationOptions(fetchStates, 'all');
  const state = selectedOption(states.options, value.state);
  const districts = useLocationOptions(fetchDistricts, state?.code);
  const district = selectedOption(districts.options, value.district);
  const talukas = useLocationOptions(fetchTalukas, district?.code);
  const taluka = selectedOption(talukas.options, value.taluka);
  const villages = useLocationOptions(fetchVillages, taluka?.code);
  const village = selectedOption(villages.options, value.village);

  const levels = [
    { field: 'state', label: 'State', data: states, selected: state, enabled: true },
    { field: 'district', label: 'District', data: districts, selected: district, enabled: !!state, parent: 'state' },
    { field: 'taluka', label: 'Taluka', data: talukas, selected: taluka, enabled: !!district, parent: 'district' },
    { field: 'village', label: 'Village', data: villages, selected: village, enabled: !!taluka, parent: 'taluka' }
  ];

  const update = (level, code) => {
    const selected = level.data.options.find((option) => String(option.code) === code);
    const next = Object.fromEntries(fields.map((field) => [field, value[field] || '']));
    next[level.field] = selected?.name || '';
    fields.slice(fields.indexOf(level.field) + 1).forEach((field) => { next[field] = ''; });
    onChange(next);
  };

  return (
    <>
      {levels.map((level) => (
        <label key={level.field} className={labelClassName}>
          {level.label}
          <select
            value={level.selected?.code ?? ''}
            onChange={(event) => update(level, event.target.value)}
            className={inputClassName}
            required={required}
            disabled={!level.enabled || level.data.loading || level.data.error || level.data.options.length === 0}
          >
            <option value="">
              {!level.enabled ? `Select ${level.parent} first`
                : level.data.loading ? `Loading ${level.label.toLowerCase()}s...`
                  : `Select ${level.label.toLowerCase()}`}
            </option>
            {level.data.options.map((option) => (
              <option key={option.code} value={option.code}>{option.name}</option>
            ))}
          </select>
          {level.enabled && level.data.error && (
            <span role="alert" className="mt-1 block text-xs text-rose-600">
              Could not load {level.label.toLowerCase()}s.{' '}
              <button type="button" className="underline" onClick={level.data.retry}>Try again</button>
            </span>
          )}
          {level.enabled && !level.data.loading && !level.data.error && level.data.options.length === 0 && (
            <span className="mt-1 block text-xs text-amber-600">
              No {level.label.toLowerCase()}s available for this selection.
            </span>
          )}
        </label>
      ))}
    </>
  );
}

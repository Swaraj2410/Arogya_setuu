import React, { useMemo, useState } from 'react';
import { CheckCircle2, FileText, RotateCcw, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { generateClinicalNoteDraft } from '../api/ai';
import Button from './Button';

const exampleNotes = `Patient reports fever, cough and body pain for 3 days.
Likely viral fever. Recommend rest and hydration.
Paracetamol 500 mg twice daily after food for 5 days.
Follow up after 5 days.`;

const previewFields = [
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'treatment', label: 'Treatment' },
  { key: 'medicines', label: 'Medicines' },
  { key: 'dosageInstructions', label: 'Dosage Instructions' },
  { key: 'notes', label: 'Notes' }
];

export default function AiClinicalNoteAssistant({ onApply, hasExistingValues = false, disabled = false }) {
  const [roughNotes, setRoughNotes] = useState('');
  const [draft, setDraft] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [confirmApply, setConfirmApply] = useState(false);

  const cleanedNotes = useMemo(() => roughNotes.trim(), [roughNotes]);

  const handleGenerate = async () => {
    setError('');
    setConfirmApply(false);
    if (cleanedNotes.length < 3) {
      setError('Enter rough consultation notes with at least 3 characters.');
      return;
    }
    if (cleanedNotes.length > 4000) {
      setError('Keep rough notes under 4000 characters.');
      return;
    }

    setGenerating(true);
    try {
      const response = await generateClinicalNoteDraft({ roughNotes: cleanedNotes });
      setDraft({
        diagnosis: response.diagnosis || '',
        treatment: response.treatment || '',
        medicines: response.medicines || '',
        dosageInstructions: response.dosageInstructions || '',
        notes: response.notes || ''
      });
    } catch (err) {
      setDraft(null);
      setError(err.response?.data?.message || 'AI clinical note assistant is temporarily unavailable.');
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = () => {
    if (!draft) return;
    if (hasExistingValues && !confirmApply) {
      setConfirmApply(true);
      return;
    }
    onApply(draft);
    setConfirmApply(false);
  };

  const handleDiscard = () => {
    setDraft(null);
    setConfirmApply(false);
    setError('');
  };

  return (
    <div className="space-y-4 border-b border-slate-100 pb-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <FileText size={18} className="text-brand-700" aria-hidden="true" />
          AI Clinical Note Assistant
        </p>
        {draft && <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">Draft only</span>}
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
        <p className="flex items-start gap-2">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>AI-generated documentation is a draft. Review and verify all information before saving the consultation.</span>
        </p>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Doctor rough notes
        <textarea
          value={roughNotes}
          onChange={(event) => {
            setRoughNotes(event.target.value);
            setConfirmApply(false);
          }}
          rows={5}
          className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6"
          placeholder={exampleNotes}
          disabled={disabled || generating}
        />
      </label>

      {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {!draft && (
          <Button type="button" icon={Sparkles} onClick={handleGenerate} disabled={disabled || generating}>
            {generating ? 'Generating...' : 'Generate AI Draft'}
          </Button>
        )}
      </div>

      {draft && (
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Sparkles size={17} className="text-brand-700" aria-hidden="true" />
              AI Generated Draft
            </p>
            {hasExistingValues && (
              <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Applying this draft will replace populated Complete Visit fields.
              </p>
            )}
            {confirmApply && (
              <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                Click Confirm Apply to replace the current form values.
              </p>
            )}
          </div>

          <dl className="grid gap-3 md:grid-cols-2">
            {previewFields.map((field) => (
              <div key={field.key} className={field.key === 'notes' ? 'md:col-span-2' : ''}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{field.label}</dt>
                <dd className="mt-1 min-h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
                  {draft[field.key] || <span className="text-slate-400">Not provided</span>}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" icon={RotateCcw} onClick={handleGenerate} disabled={disabled || generating}>
              {generating ? 'Generating...' : 'Regenerate'}
            </Button>
            <Button type="button" variant="secondary" icon={Trash2} onClick={handleDiscard} disabled={disabled || generating}>
              Discard
            </Button>
            <Button type="button" icon={CheckCircle2} onClick={handleApply} disabled={disabled || generating}>
              {confirmApply ? 'Confirm Apply' : 'Apply to Form'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

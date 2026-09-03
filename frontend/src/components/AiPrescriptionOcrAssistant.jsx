import React, { useMemo, useState } from 'react';
import { CheckCircle2, FileText, ShieldCheck, Sparkles, Trash2, Upload } from 'lucide-react';
import { extractPrescriptionDraft } from '../api/ai';
import Button from './Button';

const formatMedicineLine = (medicine = {}) => [medicine.name, medicine.dosage].filter(Boolean).join(' ');

const formatInstructionLine = (medicine = {}) => {
  const details = [medicine.frequency, medicine.duration, medicine.instructions].filter(Boolean).join(', ');
  if (!details) return '';
  return medicine.name ? `${medicine.name}: ${details}` : details;
};

export const prescriptionOcrDraftToForm = (draft = {}) => {
  const medicines = (draft.medicines || [])
    .map(formatMedicineLine)
    .filter(Boolean)
    .join('; ');
  const instructions = [
    ...(draft.medicines || []).map(formatInstructionLine).filter(Boolean),
    draft.additionalInstructions || ''
  ]
    .filter(Boolean)
    .join('; ');

  return {
    medicines,
    dosageInstructions: instructions
  };
};

export default function AiPrescriptionOcrAssistant({ onApply, hasExistingValues = false, disabled = false }) {
  const [file, setFile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');
  const [confirmApply, setConfirmApply] = useState(false);

  const formDraft = useMemo(() => prescriptionOcrDraftToForm(draft || {}), [draft]);

  const handleExtract = async () => {
    setError('');
    setConfirmApply(false);
    if (!file) {
      setError('Upload a prescription image first.');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setError('Upload a PNG or JPG prescription image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Prescription image must be 5 MB or smaller.');
      return;
    }

    setExtracting(true);
    try {
      const response = await extractPrescriptionDraft(file);
      setDraft({
        rawText: response.rawText || '',
        medicines: response.medicines || [],
        additionalInstructions: response.additionalInstructions || '',
        verificationRequired: Boolean(response.verificationRequired),
        qualityWarning: response.qualityWarning || ''
      });
    } catch (err) {
      setDraft(null);
      setError(err.response?.data?.message || 'AI prescription digitizer is temporarily unavailable.');
    } finally {
      setExtracting(false);
    }
  };

  const handleApply = () => {
    if (!draft) return;
    if (hasExistingValues && !confirmApply) {
      setConfirmApply(true);
      return;
    }
    onApply(formDraft);
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
          <Upload size={18} className="text-brand-700" aria-hidden="true" />
          Digitize Prescription with AI
        </p>
        {draft && <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">Prescription draft</span>}
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
        <p className="flex items-start gap-2">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>AI/OCR extracted information may contain errors. Verify all prescription details before saving.</span>
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="block text-sm font-medium text-slate-700">
          Prescription image
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setDraft(null);
              setConfirmApply(false);
              setError('');
            }}
            className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-800"
            disabled={disabled || extracting}
          />
        </label>
        <div className="flex items-end">
          <Button type="button" icon={Sparkles} onClick={handleExtract} disabled={disabled || extracting}>
            {extracting ? 'Extracting...' : 'Extract Draft'}
          </Button>
        </div>
      </div>

      {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

      {draft && (
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <FileText size={17} className="text-brand-700" aria-hidden="true" />
              Structured Prescription Draft
            </p>
            {draft.verificationRequired && (
              <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                {draft.qualityWarning || 'Doctor verification is required before saving this prescription.'}
              </p>
            )}
            {hasExistingValues && (
              <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Applying this draft will replace populated prescription fields.
              </p>
            )}
            {confirmApply && (
              <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                Click Confirm Apply to replace the current prescription fields.
              </p>
            )}
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Raw extracted text</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{draft.rawText}</p>
          </div>

          {draft.medicines.length > 0 ? (
            <div className="grid gap-3">
              {draft.medicines.map((medicine, index) => (
                <div key={`${medicine.name || 'medicine'}-${index}`} className="rounded-md border border-slate-200 bg-white p-3">
                  <p className="font-semibold text-slate-950">{medicine.name || 'Unnamed medicine'}</p>
                  <dl className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    <div><dt className="font-semibold text-slate-500">Dosage</dt><dd>{medicine.dosage || 'Not provided'}</dd></div>
                    <div><dt className="font-semibold text-slate-500">Frequency</dt><dd>{medicine.frequency || 'Not provided'}</dd></div>
                    <div><dt className="font-semibold text-slate-500">Duration</dt><dd>{medicine.duration || 'Not provided'}</dd></div>
                    <div><dt className="font-semibold text-slate-500">Instructions</dt><dd>{medicine.instructions || 'Not provided'}</dd></div>
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              No medicines were confidently extracted.
            </p>
          )}

          {draft.additionalInstructions && (
            <div className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Additional instructions</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{draft.additionalInstructions}</p>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" icon={Trash2} onClick={handleDiscard} disabled={disabled || extracting}>
              Discard
            </Button>
            <Button type="button" icon={CheckCircle2} onClick={handleApply} disabled={disabled || extracting}>
              {confirmApply ? 'Confirm Apply' : 'Apply to Form'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

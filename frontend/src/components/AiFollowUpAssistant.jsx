import React, { useEffect, useMemo, useState } from 'react';
import { BellPlus, CalendarDays, CheckCircle2, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { analyzeFollowUp, createFollowUpReminder } from '../api/ai';
import { formatDate } from '../utils/formatters';
import Button from './Button';

const buildConsultationNotes = (visitForm = {}) => [
  visitForm.diagnosis ? `Diagnosis: ${visitForm.diagnosis}` : '',
  visitForm.treatment ? `Treatment: ${visitForm.treatment}` : '',
  visitForm.medicines ? `Medicines: ${visitForm.medicines}` : '',
  visitForm.dosageInstructions ? `Dosage instructions: ${visitForm.dosageInstructions}` : '',
  visitForm.notes ? `Notes: ${visitForm.notes}` : ''
].filter(Boolean).join('\n');

export default function AiFollowUpAssistant({ patientId, visitDate, visitForm, disabled = false }) {
  const [analysis, setAnalysis] = useState(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const consultationNotes = useMemo(() => buildConsultationNotes(visitForm), [visitForm]);

  useEffect(() => {
    setAnalysis(null);
    setFollowUpDate('');
    setError('');
    setSuccess('');
  }, [patientId]);

  const handleAnalyze = async () => {
    setError('');
    setSuccess('');
    if (!patientId || !visitDate) {
      setError('Select an active patient visit before follow-up analysis.');
      return;
    }
    if (consultationNotes.trim().length < 3) {
      setError('Add consultation details before analyzing follow-up instructions.');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await analyzeFollowUp({
        patientId,
        visitDate,
        consultationNotes
      });
      setAnalysis(response);
      setFollowUpDate(response.suggestedDate || '');
    } catch (err) {
      setAnalysis(null);
      setFollowUpDate('');
      setError(err.response?.data?.message || 'AI follow-up assistant is temporarily unavailable.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateReminder = async () => {
    setError('');
    setSuccess('');
    if (!analysis?.followUpRequired) {
      setError('No follow-up reminder is currently suggested.');
      return;
    }
    if (!followUpDate) {
      setError('Select a follow-up date before creating a reminder.');
      return;
    }

    setCreating(true);
    try {
      await createFollowUpReminder({
        patientId,
        followUpDate,
        reason: analysis.reason || analysis.reviewReason || 'Follow-up review',
        reminderMessage: analysis.reminderMessage || 'Your doctor recommended a follow-up consultation.'
      });
      setSuccess('Follow-up reminder notification created for the patient.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create follow-up reminder.');
    } finally {
      setCreating(false);
    }
  };

  const handleDiscard = () => {
    setAnalysis(null);
    setFollowUpDate('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="space-y-4 border-t border-slate-100 pt-5 md:col-span-2">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <BellPlus size={18} className="text-brand-700" aria-hidden="true" />
          AI Follow-Up Suggestion
        </p>
        {analysis && <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">Doctor controlled</span>}
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
        <p className="flex items-start gap-2">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>AI follow-up reminders are suggestions. Create a patient notification only after reviewing the date and message.</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" icon={Search} onClick={handleAnalyze} disabled={disabled || analyzing || creating}>
          {analyzing ? 'Analyzing...' : analysis ? 'Reanalyze Follow-Up' : 'Generate Follow-Up Reminder'}
        </Button>
        {analysis && (
          <Button type="button" variant="secondary" icon={Trash2} onClick={handleDiscard} disabled={disabled || analyzing || creating}>
            Discard
          </Button>
        )}
      </div>

      {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}
      {success && <p className="rounded-md bg-field-50 px-3 py-2 text-sm font-medium text-field-700">{success}</p>}

      {analysis && (
        <div className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Follow-up required</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{analysis.followUpRequired ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI timing</p>
              <p className="mt-1 text-sm text-slate-700">
                {analysis.afterDays ? `After ${analysis.afterDays} days` : analysis.followUpDateText || 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</p>
              <p className="mt-1 text-sm text-slate-700">{analysis.reason || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested date</p>
              <label className="mt-1 flex items-center gap-2">
                <CalendarDays size={17} className="text-brand-700" aria-hidden="true" />
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(event) => setFollowUpDate(event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  disabled={disabled || creating || !analysis.followUpRequired}
                />
              </label>
              {followUpDate && <p className="mt-1 text-xs text-slate-500">{formatDate(followUpDate)}</p>}
            </div>
          </div>

          {analysis.requiresReview && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              {analysis.reviewReason || 'Follow-up timing needs doctor review before creating a reminder.'}
            </p>
          )}

          {analysis.reminderMessage && (
            <div className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reminder message</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{analysis.reminderMessage}</p>
            </div>
          )}

          {analysis.followUpRequired && (
            <div className="flex justify-end">
              <Button type="button" icon={CheckCircle2} onClick={handleCreateReminder} disabled={disabled || creating || !followUpDate}>
                {creating ? 'Creating...' : 'Create Reminder'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

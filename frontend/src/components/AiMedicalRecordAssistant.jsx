import React, { useEffect, useMemo, useState } from 'react';
import { FileText, MessageSquareText, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { askMedicalRecords } from '../api/ai';
import { formatDate, getPatientName } from '../utils/formatters';
import Button from './Button';
import EmptyState from './EmptyState';
import SectionCard from './SectionCard';

const suggestions = [
  'Summarize medical history',
  'Recent medications',
  'Previous diagnoses',
  'Last consultation summary'
];

const sourceLabel = (source = {}) => {
  const type = source.recordType === 'PRESCRIPTION' ? 'Prescription' : 'Medical Record';
  const date = source.date ? ` - ${formatDate(source.date)}` : '';
  return `${type} #${source.recordId}${date}`;
};

export default function AiMedicalRecordAssistant({ records = [], loading = false }) {
  const patientOptions = useMemo(() => {
    const byId = new Map();
    records.forEach((record) => {
      const patient = record.Patient || record.patient || {};
      const id = record.patientId || patient.id;
      if (!id || byId.has(String(id))) return;
      byId.set(String(id), {
        id: String(id),
        name: getPatientName(patient)
      });
    });
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [records]);

  const [patientId, setPatientId] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!patientId && patientOptions.length > 0) {
      setPatientId(patientOptions[0].id);
    }
    if (patientId && !patientOptions.some((patient) => patient.id === patientId)) {
      setPatientId(patientOptions[0]?.id || '');
      setAnswer(null);
    }
  }, [patientId, patientOptions]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleaned = question.trim();
    setError('');

    if (!patientId) {
      setError('Select a patient with available records.');
      return;
    }
    if (cleaned.length < 3) {
      setError('Enter a question with at least 3 characters.');
      return;
    }

    setAsking(true);
    try {
      const response = await askMedicalRecords(patientId, { question: cleaned });
      setAnswer(response);
    } catch (err) {
      setAnswer(null);
      setError(err.response?.data?.message || 'AI medical record assistant is temporarily unavailable.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <SectionCard
      title="AI Medical Record Assistant"
      action={answer ? <span className="text-sm text-slate-500">{answer.retrievedChunks || 0} chunks used</span> : null}
    >
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            <p className="flex items-start gap-2">
              <ShieldCheck size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                This assistant summarizes information from existing patient records. Always verify the source record before
                making clinical decisions.
              </span>
            </p>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Patient
            <select
              value={patientId}
              onChange={(event) => {
                setPatientId(event.target.value);
                setAnswer(null);
              }}
              className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              disabled={loading || asking || patientOptions.length === 0}
            >
              <option value="">{loading ? 'Loading patients...' : 'Select patient'}</option>
              {patientOptions.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Question
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="Example: What medications were prescribed during the last consultation?"
              disabled={asking || patientOptions.length === 0}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setQuestion(item)}
                className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                disabled={asking}
              >
                {item}
              </button>
            ))}
          </div>

          {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

          <Button type="submit" icon={asking ? Sparkles : Send} disabled={asking || patientOptions.length === 0}>
            {asking ? 'Asking AI...' : 'Ask AI'}
          </Button>
        </form>

        <div className="space-y-4">
          {answer ? (
            <>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-brand-700">
                  <MessageSquareText size={18} aria-hidden="true" />
                  Answer
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">{answer.answer}</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <FileText size={17} className="text-brand-700" aria-hidden="true" />
                  Sources
                </p>
                {answer.sources?.length > 0 ? (
                  <ul className="mt-3 grid gap-2">
                    {answer.sources.map((source) => (
                      <li
                        key={`${source.recordType}-${source.recordId}`}
                        className="rounded-md border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-slate-700"
                      >
                        {sourceLabel(source)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">No source record was cited for this answer.</p>
                )}
              </div>
            </>
          ) : patientOptions.length > 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <Sparkles size={17} className="text-brand-700" aria-hidden="true" />
                Ask from authorized records
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Answers are generated from the selected patient's medical records and linked prescriptions available to you.
              </p>
            </div>
          ) : (
            <EmptyState icon={FileText} title="No patient records available" text="The assistant appears after records exist for your patients." />
          )}
        </div>
      </div>
    </SectionCard>
  );
}

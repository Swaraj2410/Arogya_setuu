import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Bot, IndianRupee, Languages, Mic, Send, ShieldAlert, Sparkles, Square, Stethoscope, Volume2 } from 'lucide-react';
import { analyzeSymptoms, transcribeVoice } from '../api/ai';
import { useLocale } from '../state/LocaleContext';
import { formatCurrency, getDoctorName, getSpecializationName, normalizeDoctor } from '../utils/formatters';
import Button from './Button';
import EmptyState from './EmptyState';
import ProfileAvatar from './ProfileAvatar';
import SectionCard from './SectionCard';

const urgencyStyles = {
  LOW: 'border-field-100 bg-field-50 text-field-700',
  MEDIUM: 'border-amber-200 bg-amber-50 text-amber-800',
  HIGH: 'border-orange-200 bg-orange-50 text-orange-800',
  EMERGENCY: 'border-rose-200 bg-rose-50 text-rose-800'
};

const voiceLanguages = [
  { code: 'en', label: 'English', speech: 'en-US' },
  { code: 'hi', label: 'हिंदी', speech: 'hi-IN' },
  { code: 'mr', label: 'मराठी', speech: 'mr-IN' }
];

export default function AiSymptomAssistant({ compact = false, doctorLimit, title = 'AI Symptom Assistant' }) {
  const locale = useLocale();
  const [symptoms, setSymptoms] = useState('');
  const [language, setLanguage] = useState(() => {
    const current = locale?.language || 'en';
    return voiceLanguages.some((item) => item.code === current) ? current : 'en';
  });
  const [assessment, setAssessment] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const visibleDoctors = doctorLimit ? doctors.slice(0, doctorLimit) : doctors;

  useEffect(() => {
    const current = locale?.language || 'en';
    if (voiceLanguages.some((item) => item.code === current)) {
      setLanguage(current);
    }
  }, [locale?.language]);

  const updateLanguage = (code) => {
    setLanguage(code);
    locale?.setLanguage?.(code);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleaned = symptoms.trim();
    setError('');

    if (cleaned.length < 5) {
      setError('Describe your symptoms in at least 5 characters.');
      return;
    }

    setLoading(true);
    try {
      const data = await analyzeSymptoms({ symptoms: cleaned, language });
      setAssessment(data.assessment || null);
      setDoctors((data.doctors || []).map(normalizeDoctor));
    } catch (err) {
      setAssessment(null);
      setDoctors([]);
      setError(err.response?.data?.message || 'AI symptom assistant is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Voice recording is not supported in this browser. Please type symptoms manually.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const options = window.MediaRecorder.isTypeSupported?.('audio/webm') ? { mimeType: 'audio/webm' } : undefined;
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        setRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        handleTranscription(audioBlob);
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      setError('Microphone access failed. Please allow microphone access or type symptoms manually.');
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  };

  const handleTranscription = async (audioBlob) => {
    if (!audioBlob || audioBlob.size === 0) {
      setError('No voice recording was captured.');
      return;
    }
    setTranscribing(true);
    try {
      const response = await transcribeVoice(audioBlob, language);
      setSymptoms(response.text || '');
      if (response.language && voiceLanguages.some((item) => item.code === response.language)) {
        updateLanguage(response.language);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Voice transcription is temporarily unavailable. Please type symptoms manually.');
    } finally {
      setTranscribing(false);
    }
  };

  const readResponse = () => {
    if (!assessment) return;
    if (!window.speechSynthesis) {
      setError('Read aloud is not supported in this browser.');
      return;
    }
    const speechLanguage = voiceLanguages.find((item) => item.code === language)?.speech || 'en-US';
    const text = [
      `Recommended specialization: ${assessment.recommendedSpecialization}`,
      assessment.reason,
      assessment.recommendation,
      ...(assessment.warningSigns?.length ? [`Warning signs: ${assessment.warningSigns.join(', ')}`] : [])
    ].filter(Boolean).join('. ');
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLanguage;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <SectionCard
      title={title}
      action={
        assessment ? (
          <span
            className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${
              urgencyStyles[assessment.urgency] || urgencyStyles.MEDIUM
            }`}
          >
            {assessment.urgency}
          </span>
        ) : null
      }
    >
      <div className={compact ? 'grid gap-4 xl:grid-cols-[0.9fr_1.1fr]' : 'space-y-5'}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            <p className="flex items-start gap-2">
              <ShieldAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>This assistant provides preliminary triage guidance only and does not provide a medical diagnosis.</span>
            </p>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            <span className="flex items-center gap-2">
              <Languages size={16} className="text-brand-700" aria-hidden="true" />
              Language
            </span>
            <span className="mt-2 grid grid-cols-3 overflow-hidden rounded-md border border-slate-200 bg-white">
              {voiceLanguages.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => updateLanguage(item.code)}
                  className={`h-10 text-sm font-semibold ${
                    language === item.code ? 'bg-brand-700 text-white' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  disabled={loading || recording || transcribing}
                >
                  {item.label}
                </button>
              ))}
            </span>
          </label>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-950">Voice symptoms</p>
              <div className="flex flex-wrap gap-2">
                {recording ? (
                  <Button type="button" variant="danger" size="sm" icon={Square} onClick={stopRecording}>
                    Stop Recording
                  </Button>
                ) : (
                  <Button type="button" variant="secondary" size="sm" icon={Mic} onClick={startRecording} disabled={loading || transcribing}>
                    Start Recording
                  </Button>
                )}
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {recording ? 'Recording...' : transcribing ? 'Transcribing voice...' : 'Record in English, Hindi, or Marathi, then edit the text before analysis.'}
            </p>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Symptoms
            <textarea
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
              rows={compact ? 4 : 5}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="Example: skin rash and severe itching for two days"
              disabled={loading || transcribing}
            />
          </label>

          {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

          <Button type="submit" icon={loading ? Sparkles : Send} disabled={loading} className={compact ? 'w-full sm:w-auto' : ''}>
            {loading ? 'Analyzing...' : 'Analyze Symptoms'}
          </Button>
        </form>

        <div className="space-y-4">
          {assessment ? (
            <>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-sm font-semibold text-brand-700">
                    <Bot size={18} aria-hidden="true" />
                    AI assessment
                  </p>
                  <Button type="button" variant="secondary" size="sm" icon={Volume2} onClick={readResponse}>
                    Read Response
                  </Button>
                </div>
                <div className="mt-3 grid gap-3 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-950">Recommended specialization: </span>
                    {assessment.recommendedSpecialization}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">Reason: </span>
                    {assessment.reason}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">Next step: </span>
                    {assessment.recommendation}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <AlertTriangle size={17} className="text-amber-600" aria-hidden="true" />
                  Warning signs
                </p>
                {assessment.warningSigns?.length > 0 ? (
                  <ul className="mt-3 grid gap-2 text-sm text-slate-700">
                    {assessment.warningSigns.map((item) => (
                      <li key={item} className="rounded-md bg-amber-50 px-3 py-2 text-amber-900">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">No specific warning signs were returned.</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">Matching doctors</p>
                  {doctorLimit && doctors.length > doctorLimit && (
                    <Button as={Link} to="/doctors" variant="secondary" size="sm">
                      View all
                    </Button>
                  )}
                </div>
                {visibleDoctors.length > 0 ? (
                  <div className="grid gap-3">
                    {visibleDoctors.map((doctor) => (
                      <div key={doctor.id} className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex items-start gap-3">
                          <ProfileAvatar name={getDoctorName(doctor)} role="doctor" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-950">{getDoctorName(doctor)}</p>
                            <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                              <Stethoscope size={15} className="text-brand-700" aria-hidden="true" />
                              {getSpecializationName(doctor)}
                            </p>
                            <p className="mt-2 flex items-center gap-1 text-sm text-slate-600">
                              <IndianRupee size={15} className="text-slate-500" aria-hidden="true" />
                              {formatCurrency(doctor.consultationFee || 0)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <Button as={Link} to={`/doctors/${doctor.id}`} variant="secondary" className="flex-1">
                            View Schedule
                          </Button>
                          <Button as={Link} to="/appointments" className="flex-1">
                            Book Appointment
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Stethoscope}
                    title="No matching doctors found"
                    text="The specialization exists, but no doctors are registered for it yet."
                  />
                )}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <Sparkles size={17} className="text-brand-700" aria-hidden="true" />
                Awaiting symptoms
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The recommendation will use only the doctor specializations currently stored in Arogya Rural.
              </p>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

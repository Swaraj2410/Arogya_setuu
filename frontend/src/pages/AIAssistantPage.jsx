import React from 'react';
import { AlertTriangle, Languages } from 'lucide-react';
import AiSymptomAssistant from '../components/AiSymptomAssistant';
import Badge from '../components/Badge';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../state/AuthContext';
import { useLocale } from '../state/LocaleContext';

export default function AIAssistantPage() {
  const { user } = useAuth();
  const { language, languages, setLanguage, t } = useLocale();

  return (
    <DashboardLayout role={user?.role || 'patient'} title="AI Health Assistant" subtitle="Symptom triage and doctor routing">
      <PageHeader
        eyebrow="AI triage"
        title="AI Symptom Assistant"
        text="Describe symptoms in simple words. Arogya Rural will route the request through Spring Boot and return matching doctors from the database."
        action={<Badge label="Patient only" variant="warm" />}
      />

      <AiSymptomAssistant title="Find the Right Doctor" />

      <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <SectionCard title="Safety Guidance">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={17} aria-hidden="true" />
              Emergency guidance
            </p>
            <p className="mt-2">
              For severe chest pain, breathing difficulty, heavy bleeding, loss of consciousness, stroke symptoms, or any
              rapidly worsening condition, seek immediate professional or emergency medical care.
            </p>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">{t.aiSafety}</p>
        </SectionCard>

        <SectionCard title="Language">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <label className="block text-sm font-medium text-slate-700">
              Assistant language
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              >
                {languages.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <Languages size={21} className="text-brand-700" aria-hidden="true" />
              <p className="mt-2 font-semibold text-slate-950">English, Hindi, Marathi</p>
              <p className="mt-1 text-sm text-slate-600">Voice triage supports multilingual transcription and response text.</p>
            </div>
          </div>
        </SectionCard>
      </section>
    </DashboardLayout>
  );
}

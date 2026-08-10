import React, { useState } from 'react';
import { AlertTriangle, Bot, CalendarDays, Languages, Mic, Pill, Search, Sparkles, Stethoscope } from 'lucide-react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../state/AuthContext';
import { useLocale } from '../state/LocaleContext';

const quickOptions = [
  { icon: Stethoscope, title: 'Find the right doctor', text: 'Future recommendation based on symptoms and schedules.' },
  { icon: Search, title: 'Understand my symptoms', text: 'Future general guidance, not a diagnosis.' },
  { icon: Pill, title: 'Explain my prescription', text: 'Future simple-language medicine explanation.' },
  { icon: CalendarDays, title: 'Find upcoming village visits', text: 'Use village schedules from the existing API.' }
];

export default function AIAssistantPage() {
  const { user } = useAuth();
  const { language, languages, setLanguage, t } = useLocale();
  const [symptoms, setSymptoms] = useState('');
  const [date, setDate] = useState('');
  const [village, setVillage] = useState(user?.patientProfile?.village || '');

  return (
    <DashboardLayout role={user?.role || 'patient'} title="AI Health Assistant" subtitle="Future multilingual assistance interface">
      <PageHeader
        eyebrow="Future AI workspace"
        title="Namaste. How can I help you today?"
        text="This screen is ready for AI integration, but no AI backend is connected yet. It will not generate medical answers or diagnoses."
        action={<Badge label="UI only" variant="warm" />}
      />

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-700">
            <Bot size={18} aria-hidden="true" />
            Arogya AI
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950">General healthcare assistance, not diagnosis</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">{t.aiSafety}</p>
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={17} aria-hidden="true" />
              Emergency guidance
            </p>
            <p className="mt-2">
              For severe chest pain, breathing difficulty, heavy bleeding, loss of consciousness, stroke symptoms, or any
              rapidly worsening condition, seek immediate professional or emergency medical care.
            </p>
          </div>
        </Card>

        <SectionCard title="Quick Options">
          <div className="grid gap-3 sm:grid-cols-2">
            {quickOptions.map((item) => (
              <button
                key={item.title}
                type="button"
                className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-brand-200"
              >
                <item.icon size={22} className="text-brand-700" aria-hidden="true" />
                <p className="mt-3 font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-600">{item.text}</p>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Find the Right Doctor">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_220px]">
          <label className="block text-sm font-medium text-slate-700">
            Symptoms or concern
            <textarea
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder="Example: fever for two days, cough, child health concern"
            />
          </label>
          <div className="grid gap-4">
            <label className="block text-sm font-medium text-slate-700">
              Preferred village
              <input
                value={village}
                onChange={(event) => setVillage(event.target.value)}
                className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Preferred date
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              />
            </label>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Sparkles size={17} aria-hidden="true" />
              Recommendation engine
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Future AI can consider symptoms, age, village, doctor specialization, schedules, and open slots. It will not
              fake recommendations until an AI API exists.
            </p>
            <Button disabled className="mt-4 w-full">
              AI backend not connected
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Language and Voice Readiness">
        <div className="grid gap-3 sm:grid-cols-3">
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
            <p className="mt-1 text-sm text-slate-600">Translation-ready frontend structure.</p>
          </div>
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
            <Mic size={21} className="text-slate-500" aria-hidden="true" />
            <p className="mt-2 font-semibold text-slate-950">Voice input placeholder</p>
            <p className="mt-1 text-sm text-slate-600">Microphone UI is ready for future speech support.</p>
          </div>
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}

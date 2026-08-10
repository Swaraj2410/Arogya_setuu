import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Bot,
  CalendarCheck,
  FileText,
  Languages,
  MapPin,
  Pill,
  Route,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRoundCheck
} from 'lucide-react';
import Brand from '../components/Brand';
import Button from '../components/Button';
import Card from '../components/Card';
import LanguageSelector from '../components/LanguageSelector';
import { useLocale } from '../state/LocaleContext';
import heroImage from '../assets/rural-care-hero.png';

const problems = [
  {
    icon: Route,
    title: 'Long travel without clear information',
    text: 'Patients may travel 20-30 km because the village visit schedule did not reach them in time.'
  },
  {
    icon: CalendarCheck,
    title: 'Doctor visits change dynamically',
    text: 'Doctors decide village, date, and time based on local needs. A fixed weekly timetable is not enough.'
  },
  {
    icon: Bell,
    title: 'Village schedules need direct communication',
    text: 'Arogya Rural lets doctors publish village visits so patients can discover care closer to home.'
  }
];

const steps = [
  { title: 'Register Your Village', text: 'Select state, district, taluka, and village during patient registration.' },
  { title: 'Find Doctor Visits', text: 'See doctors who have published upcoming visits for your village.' },
  { title: 'Book Appointment', text: 'Choose an open slot and confirm your appointment from your phone.' }
];

const features = [
  { icon: MapPin, title: 'Village Doctor Schedule', text: 'Village-wise availability with date, start time, and end time.' },
  { icon: CalendarCheck, title: 'Easy Appointment Booking', text: 'Patients book only from real open doctor slots.' },
  { icon: FileText, title: 'Medical Records', text: 'Consultation notes remain linked to patient and doctor profiles.' },
  { icon: Pill, title: 'Digital Prescriptions', text: 'Prescriptions stay attached to medical records for later access.' },
  { icon: Bell, title: 'Notifications', text: 'Users can receive appointment and record updates.' },
  { icon: Languages, title: 'Multilingual Ready', text: 'Interface structure supports English, Hindi, and Marathi expansion.' }
];

const aiFeatures = [
  'AI Symptom Assistant',
  'Multilingual Health Assistant',
  'Smart Doctor Recommendation',
  'Prescription Explanation'
];

export default function LandingPage() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-[#fbf8f1] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#fbf8f1]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-700 md:flex">
            <a href="#problem" className="hover:text-brand-800">Problem</a>
            <a href="#how" className="hover:text-brand-800">How it works</a>
            <a href="#features" className="hover:text-brand-800">Features</a>
            <a href="#ai" className="hover:text-brand-800">AI</a>
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <LanguageSelector compact />
            </div>
            <Button as={Link} to="/login" variant="secondary" size="sm">
              Login
            </Button>
            <Button as={Link} to="/register" size="sm" className="hidden sm:inline-flex">
              Register
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="overflow-hidden">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
            <div className="flex min-w-0 flex-col justify-center">
              <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-md bg-field-50 px-3 py-2 text-sm font-semibold text-field-700">
                <Stethoscope size={16} aria-hidden="true" />
                Modern healthcare reaching rural India
              </p>
              <h1 className="max-w-[12ch] break-words font-display text-4xl font-semibold leading-tight text-slate-950 sm:max-w-none sm:text-5xl lg:text-6xl">
                {t.heroTitle}
              </h1>
              <p className="mt-5 max-w-[31ch] text-base leading-7 text-slate-700 sm:max-w-xl sm:text-lg">{t.heroText}</p>
              <div className="mt-7 flex w-full max-w-[calc(100vw-2rem)] flex-col gap-3 sm:max-w-none sm:flex-row">
                <Button as={Link} to="/register" size="lg" icon={MapPin}>
                  Find a Doctor
                </Button>
                <Button as={Link} to="/login" variant="secondary" size="lg" icon={Stethoscope}>
                  Doctor Login
                </Button>
              </div>
              <div className="mt-8 grid w-full max-w-[calc(100vw-2rem)] gap-3 sm:max-w-none sm:grid-cols-3">
                {[
                  ['Village visits', 'Dynamic schedules'],
                  ['Appointments', 'Real open slots'],
                  ['Records', 'Secure access']
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="text-sm font-semibold text-slate-950">{label}</p>
                    <p className="mt-1 text-sm text-slate-600">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-w-0">
              <img
                src={heroImage}
                alt="Doctor visiting a rural village community health camp"
                className="aspect-[16/10] w-full rounded-lg object-cover shadow-card"
              />
              <Card className="absolute bottom-4 left-4 hidden max-w-sm p-4 sm:block">
                <p className="flex items-center gap-2 text-sm font-semibold text-brand-800">
                  <MapPin size={16} aria-hidden="true" />
                  Village visit published
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Patients see the doctor visit in their village before travelling.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <section id="problem" className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-brand-700">The rural healthcare gap</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-slate-950">
                Patients should not travel far just to discover the doctor is not visiting today.
              </h2>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {problems.map((item) => (
                <Card key={item.title} className="p-5">
                  <item.icon size={24} className="text-earth-500" aria-hidden="true" />
                  <h3 className="mt-4 font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold text-brand-700">How Arogya Rural works</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-slate-950">
                Village first. Appointment second. Records always available.
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-700">
                The location hierarchy is not a side field. It is the core of the patient experience.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <Card key={step.title} className="p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-700 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="bg-[#f4f5ec]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-brand-700">Platform features</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-slate-950">
                Built for village visits, not generic hospital queues.
              </h2>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((item) => (
                <Card key={item.title} className="p-5">
                  <item.icon size={23} className="text-brand-700" aria-hidden="true" />
                  <h3 className="mt-4 font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="ai" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="rounded-lg border border-brand-100 bg-brand-900 p-6 text-white shadow-card md:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-earth-200">
                  <Sparkles size={17} aria-hidden="true" />
                  Smarter Healthcare Assistance
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold">AI support for clearer healthcare choices</h2>
                <p className="mt-4 text-sm leading-6 text-brand-50">
                  AI assistance can help patients understand options and find appropriate care. It does not replace
                  professional medical diagnosis.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {aiFeatures.map((item) => (
                  <div key={item} className="rounded-lg border border-white/15 bg-white/10 p-4">
                    <Bot size={20} className="text-earth-200" aria-hidden="true" />
                    <p className="mt-3 font-semibold">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 rounded-md border border-earth-200/40 bg-earth-100/10 p-4 text-sm leading-6 text-brand-50">
              {t.aiSafety}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-brand-700">
                <UserRoundCheck size={17} aria-hidden="true" />
                Are you a doctor serving rural communities?
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-slate-950">
                Publish village visits directly and help patients know when healthcare is coming closer to them.
              </h2>
            </div>
            <Button as={Link} to="/register" variant="warm" size="lg" icon={ArrowRight}>
              Join as Doctor
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-[#fbf8f1]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Brand />
          </div>
          <p className="max-w-xl">
            <ShieldCheck size={16} className="mr-1 inline text-brand-700" aria-hidden="true" />
            Arogya Rural supports doctor-published schedules, secure records, and role-based access.
          </p>
        </div>
      </footer>
    </div>
  );
}

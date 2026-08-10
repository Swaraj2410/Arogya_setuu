import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, HeartPulse, Mail, MapPinned, Stethoscope, UserRound } from 'lucide-react';
import Brand from '../components/Brand';
import Button from '../components/Button';
import Card from '../components/Card';
import LanguageSelector from '../components/LanguageSelector';
import LocationSelect from '../components/LocationSelect';
import { useAuth } from '../state/AuthContext';
import { specializations } from '../data/specializations';
import { formatLocation } from '../utils/formatters';

const steps = ['Account', 'Location', 'Profile'];

const initialForm = {
  name: '',
  email: '',
  role: 'patient',
  password: '',
  specializationId: '',
  specializationName: '',
  qualification: '',
  experienceYears: '',
  consultationFee: '',
  age: '',
  gender: '',
  phone: '',
  address: '',
  bloodGroup: '',
  state: '',
  district: '',
  taluka: '',
  village: ''
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isPatient = form.role === 'patient';
  const isDoctor = form.role === 'doctor';
  const locationLabel = useMemo(() => formatLocation(form, 'Select your village location'), [form.state, form.district, form.taluka, form.village]);

  const update = (patch) => setForm((current) => ({ ...current, ...patch }));

  const canContinue = () => {
    if (step === 0) return form.name && form.email && form.password && form.role;
    if (step === 1 && isPatient) return form.state && form.district && form.taluka && form.village;
    return true;
  };

  const buildPayload = () => ({
    name: form.name,
    email: form.email,
    role: form.role,
    password: form.password,
    specializationId: isDoctor && form.specializationId ? Number(form.specializationId) : undefined,
    specializationName: isDoctor
      ? specializations.find((item) => String(item.id) === String(form.specializationId))?.name || form.specializationName
      : undefined,
    qualification: isDoctor ? form.qualification : undefined,
    experienceYears: isDoctor && form.experienceYears ? Number(form.experienceYears) : undefined,
    consultationFee: isDoctor && form.consultationFee ? Number(form.consultationFee) : undefined,
    age: isPatient && form.age ? Number(form.age) : undefined,
    gender: isPatient ? form.gender : undefined,
    phone: isPatient ? form.phone : undefined,
    address: isPatient ? form.address : undefined,
    bloodGroup: isPatient ? form.bloodGroup : undefined,
    state: isPatient ? form.state : undefined,
    district: isPatient ? form.district : undefined,
    taluka: isPatient ? form.taluka : undefined,
    village: isPatient ? form.village : undefined
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (step < steps.length - 1) {
      if (!canContinue()) {
        setError('Please complete the required fields before continuing.');
        return;
      }
      setError('');
      setStep((current) => current + 1);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const user = await register(buildPayload());
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'We could not create your account. Please check the details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8f1] text-slate-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" aria-label="Arogya Rural home">
          <Brand />
        </Link>
        <LanguageSelector />
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 pb-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-brand-700">Create your account</p>
            <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-slate-950">
              Start with your village, then connect to care.
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              Patient location helps Arogya Rural show doctor visits near your village. Doctors can publish visits after registration.
            </p>
          </div>
          <Card className="p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <MapPinned size={17} className="text-field-700" aria-hidden="true" />
              Current location selection
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{isPatient ? locationLabel : 'Doctors publish visit locations after login.'}</p>
          </Card>
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card sm:p-7">
          <div className="mb-6 grid grid-cols-3 gap-2">
            {steps.map((label, index) => (
              <div
                key={label}
                className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                  index === step
                    ? 'border-brand-200 bg-brand-50 text-brand-800'
                    : index < step
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                <span className="flex items-center gap-2">
                  {index < step ? <CheckCircle2 size={16} aria-hidden="true" /> : index + 1}
                  {label}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-slate-950">Basic Information</h2>
                  <p className="mt-1 text-sm text-slate-600">Choose the role that matches how you will use Arogya Rural.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ['patient', UserRound, 'Patient', 'Find village visits and book appointments.'],
                    ['doctor', Stethoscope, 'Doctor', 'Publish village schedules and manage records.'],
                    ['admin', HeartPulse, 'Admin', 'Monitor reports and platform activity.']
                  ].map(([role, Icon, title, text]) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => update({ role })}
                      className={`rounded-lg border p-4 text-left ${
                        form.role === role ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={22} className="text-brand-700" aria-hidden="true" />
                      <p className="mt-3 font-semibold text-slate-950">{title}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-600">{text}</p>
                    </button>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Full name
                    <input
                      value={form.name}
                      onChange={(event) => update({ name: event.target.value })}
                      className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Email
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(event) => update({ email: event.target.value })}
                        className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm"
                        required
                      />
                    </div>
                  </label>
                  <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                    Password
                    <input
                      type="password"
                      minLength={6}
                      value={form.password}
                      onChange={(event) => update({ password: event.target.value })}
                      className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                      required
                    />
                  </label>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-slate-950">
                    {isPatient ? 'Your Location' : 'Role Details'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {isPatient
                      ? 'This location is used to show doctors visiting your village.'
                      : 'Doctors need professional details. Admin accounts can continue.'}
                  </p>
                </div>

                {isPatient && (
                  <div className="grid gap-4 rounded-lg border border-field-100 bg-field-50 p-4 sm:grid-cols-2">
                    <LocationSelect
                      value={form}
                      onChange={(location) => update(location)}
                      required
                      inputClassName="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      labelClassName="text-sm font-medium text-slate-700"
                    />
                  </div>
                )}

                {isDoctor && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Specialization
                      <select
                        value={form.specializationId}
                        onChange={(event) => update({ specializationId: event.target.value })}
                        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                        required
                      >
                        <option value="">Select specialization</option>
                        {specializations.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Qualification
                      <input
                        value={form.qualification}
                        onChange={(event) => update({ qualification: event.target.value })}
                        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                        placeholder="MBBS, MD"
                        required
                      />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Experience years
                      <input
                        type="number"
                        min="0"
                        value={form.experienceYears}
                        onChange={(event) => update({ experienceYears: event.target.value })}
                        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                        required
                      />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Consultation fee
                      <input
                        type="number"
                        min="0"
                        value={form.consultationFee}
                        onChange={(event) => update({ consultationFee: event.target.value })}
                        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                        required
                      />
                    </label>
                  </div>
                )}

                {form.role === 'admin' && (
                  <Card className="p-4">
                    <p className="font-semibold text-slate-950">Admin account</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Admin access is protected by role-based backend permissions after registration.
                    </p>
                  </Card>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-slate-950">Optional Health Profile</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    These details help doctors understand the patient context. You can leave optional fields blank.
                  </p>
                </div>
                {isPatient ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Age
                      <input
                        type="number"
                        min="0"
                        value={form.age}
                        onChange={(event) => update({ age: event.target.value })}
                        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                      />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Gender
                      <select
                        value={form.gender}
                        onChange={(event) => update({ gender: event.target.value })}
                        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                      >
                        <option value="">Select</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Phone
                      <input
                        value={form.phone}
                        onChange={(event) => update({ phone: event.target.value })}
                        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                        placeholder="+91 98765 12345"
                      />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Blood group
                      <input
                        value={form.bloodGroup}
                        onChange={(event) => update({ bloodGroup: event.target.value })}
                        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                        placeholder="O+, A-, B+"
                      />
                    </label>
                    <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                      Address
                      <input
                        value={form.address}
                        onChange={(event) => update({ address: event.target.value })}
                        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                      />
                    </label>
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600 sm:col-span-2">
                      Existing conditions, allergies, preferred language, voice preference, and AI consent can be added when
                      the backend health profile supports them.
                    </div>
                  </div>
                ) : (
                  <Card className="p-4">
                    <p className="font-semibold text-slate-950">Ready to continue</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Your {form.role} workspace will open after account creation.
                    </p>
                  </Card>
                )}
              </div>
            )}

            {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
              <Button
                variant="secondary"
                onClick={() => (step === 0 ? navigate('/login') : setStep((current) => current - 1))}
                disabled={loading}
              >
                {step === 0 ? 'Back to login' : 'Back'}
              </Button>
              <Button type="submit" disabled={loading || !canContinue()}>
                {step === steps.length - 1 ? (loading ? 'Creating account...' : 'Register & Continue') : 'Continue'}
              </Button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail, MapPin, ShieldCheck, Stethoscope } from 'lucide-react';
import Brand from '../components/Brand';
import Button from '../components/Button';
import LanguageSelector from '../components/LanguageSelector';
import { useAuth } from '../state/AuthContext';
import heroImage from '../assets/rural-care-hero.png';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const logged = await login(form.email, form.password);
      const redirect = location.state?.from?.pathname || `/${logged.role}`;
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'We could not sign you in. Check your email and password.');
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

      <main className="mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl gap-8 px-4 pb-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="relative hidden overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shadow-card lg:block">
          <img src={heroImage} alt="Rural healthcare visit" className="h-[680px] w-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-slate-950/35" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-white">
            <p className="inline-flex items-center gap-2 rounded-md bg-white/15 px-3 py-2 text-sm font-semibold backdrop-blur">
              <MapPin size={16} aria-hidden="true" />
              Healthcare closer to every village
            </p>
            <h1 className="mt-5 max-w-xl font-display text-4xl font-semibold leading-tight">
              Sign in to discover doctor visits, appointments, and care records.
            </h1>
            <div className="mt-6 grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                [Stethoscope, 'Doctors publish visits'],
                [ShieldCheck, 'Secure records'],
                [MapPin, 'Village-first care']
              ].map(([Icon, text]) => (
                <div key={text} className="rounded-md border border-white/20 bg-white/10 p-3 text-sm backdrop-blur">
                  <Icon size={18} className="mb-2 text-earth-200" aria-hidden="true" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-card sm:p-7">
          <p className="text-sm font-semibold text-brand-700">Welcome back</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-slate-950">Login to Arogya Rural</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Access your patient, doctor, or admin workspace with your registered account.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm"
                  placeholder="Enter password"
                  required
                />
              </div>
            </label>
            {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            New to Arogya Rural?{' '}
            <Link to="/register" className="font-semibold text-brand-800 hover:text-brand-900">
              Create account
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}

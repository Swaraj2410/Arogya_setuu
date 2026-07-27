import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '../state/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: 'ananya.sharma@example.com', password: 'password' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const logged = await login(form.email, form.password);
      const redirect = location.state?.from?.pathname || `/${logged.role}`;
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-soft md:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-brand-500 to-slate-900 p-10 text-white md:block">
          <p className="text-sm uppercase tracking-[0.2em]">Arogya Rural</p>
          <h1 className="mt-6 text-3xl font-semibold leading-tight">
            Welcome back.
            <br />
            Manage village visits, records, and appointments in minutes.
          </h1>
          <ul className="mt-8 space-y-3 text-sm text-brand-50/90">
            <li>• Patient, doctor, and admin views</li>
            <li>• Role-secured dashboards</li>
            <li>• Rural doctor scheduling and digital health records</li>
          </ul>
        </div>
        <div className="p-8">
          <h2 className="text-2xl font-semibold text-slate-900">Login</h2>
          <p className="text-sm text-slate-500">Use seeded credentials or any email + role combo.</p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="text-sm text-slate-600">
              Email
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm focus:border-brand-400 focus:outline-none"
                  required
                />
              </div>
            </label>
            <label className="text-sm text-slate-600">
              Password
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm focus:border-brand-400 focus:outline-none"
                  required
                />
              </div>
            </label>
            {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <p className="text-center text-xs text-slate-500">
              No account?{' '}
              <Link to="/register" className="font-semibold text-brand-700">
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

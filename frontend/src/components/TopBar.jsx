import React from 'react';
import { Bell, LogOut, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import Brand from './Brand';
import LanguageSelector from './LanguageSelector';
import ProfileAvatar from './ProfileAvatar';
import { useAuth } from '../state/AuthContext';

export default function TopBar({ title, subtitle }) {
  const { user, logout } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <header className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <Brand compact />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-brand-700">
              {greeting}, {user?.name?.split(' ')[0] || 'there'}
            </p>
            <h1 className="truncate font-display text-xl font-semibold text-slate-950">{title}</h1>
            {subtitle && <p className="hidden text-sm text-slate-600 sm:block">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSelector compact />
          </div>
          <Link
            to="/notifications"
            title="Notifications"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-earth-400" />
          </Link>
          <Link to="/profile" className="hidden items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 sm:flex">
            <ProfileAvatar name={user?.name} role={user?.role} size="sm" />
            <span className="max-w-28 truncate text-sm font-semibold text-slate-800">{user?.name}</span>
          </Link>
          <button
            type="button"
            onClick={logout}
            title="Logout"
            aria-label="Logout"
            className="hidden h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-white hover:bg-slate-800 sm:flex"
          >
            <LogOut size={18} />
          </button>
          <span className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 lg:hidden">
            <Menu size={18} />
          </span>
        </div>
      </div>
    </header>
  );
}

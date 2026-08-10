import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Bell,
  Bot,
  CalendarDays,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  MapPinned,
  Pill,
  Search,
  Settings,
  Stethoscope,
  UserRound
} from 'lucide-react';
import Brand from './Brand';
import ProfileAvatar from './ProfileAvatar';
import { useAuth } from '../state/AuthContext';

export const navConfig = {
  patient: [
    { to: '/patient', label: 'Home', icon: Home },
    { to: '/doctors', label: 'Find Doctors', icon: Search },
    { to: '/village-visits', label: 'Village Visits', icon: MapPinned },
    { to: '/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/records', label: 'Medical Records', icon: FileText },
    { to: '/prescriptions', label: 'Prescriptions', icon: Pill },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/ai-assistant', label: 'AI Assistant', icon: Bot },
    { to: '/profile', label: 'Profile', icon: UserRound }
  ],
  doctor: [
    { to: '/doctor', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/doctor/schedule', label: 'Village Schedule', icon: MapPinned },
    { to: '/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/records', label: 'Patient Records', icon: ClipboardList },
    { to: '/prescriptions', label: 'Prescriptions', icon: Pill },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'Profile', icon: UserRound }
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/doctors', label: 'Doctors', icon: Stethoscope },
    { to: '/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/records', label: 'Records', icon: ClipboardList },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'Profile', icon: Settings }
  ]
};

const linkBase = 'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold';

export default function Sidebar({ role }) {
  const { user, logout } = useAuth();
  const items = navConfig[role] || navConfig.patient;

  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-card lg:flex">
      <Brand />
      <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`
              }
            >
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-slate-200 pt-4">
        <div className="flex items-center gap-3">
          <ProfileAvatar name={user?.name} role={user?.role} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{user?.name || 'Arogya user'}</p>
            <p className="text-xs capitalize text-slate-500">{user?.role}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-3 h-10 w-full rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

import React from 'react';
import { NavLink } from 'react-router-dom';
import Sidebar, { navConfig } from '../components/Sidebar';
import TopBar from '../components/TopBar';

export default function DashboardLayout({ role, title, subtitle, children }) {
  const mobileItems = (navConfig[role] || navConfig.patient).slice(0, 5);

  return (
    <div className="app-surface min-h-screen text-slate-950">
      <div className="mx-auto flex max-w-[1440px] gap-5 px-3 py-4 sm:px-5">
        <Sidebar role={role} />
        <main className="min-w-0 flex-1 pb-20 lg:pb-4">
          <TopBar title={title} subtitle={subtitle} />
          <div className="mt-5 space-y-5">{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-2 py-2 shadow-2xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {mobileItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-semibold ${
                    isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600'
                  }`
                }
              >
                <Icon size={19} aria-hidden="true" />
                <span className="max-w-full truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

import React from 'react';
import { Mail, MapPin, Phone, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import Card from '../components/Card';
import LanguageSelector from '../components/LanguageSelector';
import PageHeader from '../components/PageHeader';
import ProfileAvatar from '../components/ProfileAvatar';
import SectionCard from '../components/SectionCard';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../state/AuthContext';
import { formatCurrency, formatLocation } from '../utils/formatters';

export default function ProfilePage() {
  const { user } = useAuth();
  const patient = user?.patientProfile || {};

  return (
    <DashboardLayout role={user?.role || 'patient'} title="Profile" subtitle="Your account and role details">
      <PageHeader
        eyebrow="Account"
        title="Profile and preferences"
        text="This page shows the fields currently returned by the Spring Boot authentication API."
      />

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <ProfileAvatar name={user?.name} role={user?.role} size="lg" />
          <div>
            <h2 className="font-display text-2xl font-semibold text-slate-950">{user?.name}</h2>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              <Mail size={16} aria-hidden="true" />
              {user?.email}
            </p>
            <p className="mt-1 inline-flex items-center gap-2 rounded-md bg-brand-50 px-2.5 py-1 text-sm font-semibold capitalize text-brand-800">
              <ShieldCheck size={15} aria-hidden="true" />
              {user?.role}
            </p>
          </div>
        </div>
      </Card>

      <section className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Role Details">
          {user?.role === 'patient' ? (
            <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <MapPin size={16} className="text-field-700" aria-hidden="true" />
                {formatLocation(patient)}
              </p>
              <p className="flex items-center gap-2">
                <Phone size={16} className="text-brand-700" aria-hidden="true" />
                {patient.phone || 'Phone not provided'}
              </p>
              <p>Age: {patient.age || 'Not provided'}</p>
              <p>Gender: {patient.gender || 'Not provided'}</p>
              <p>Blood group: {patient.bloodGroup || 'Not provided'}</p>
              <p>Address: {patient.address || 'Not provided'}</p>
            </div>
          ) : user?.role === 'doctor' ? (
            <div className="text-sm leading-6 text-slate-700">
              <p className="flex items-center gap-2 font-semibold text-slate-950">
                <Stethoscope size={17} className="text-brand-700" aria-hidden="true" />
                Doctor profile
              </p>
              <p className="mt-2">Doctor ID: {user?.doctorId}</p>
              <p>Consultation fee and specialization are visible from the doctor discovery API.</p>
              <p>Fee format example: {formatCurrency(0)}</p>
            </div>
          ) : (
            <div className="text-sm leading-6 text-slate-700">
              <p className="flex items-center gap-2 font-semibold text-slate-950">
                <UserRound size={17} className="text-brand-700" aria-hidden="true" />
                Admin profile
              </p>
              <p className="mt-2">Admin accounts can access operational dashboards and reports.</p>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Preferences">
          <div className="space-y-4">
            <LanguageSelector />
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Notification, profile editing, and AI consent settings can be activated when matching backend endpoints are available.
            </div>
          </div>
        </SectionCard>
      </section>
    </DashboardLayout>
  );
}

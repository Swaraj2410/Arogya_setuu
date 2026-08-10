import React, { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarRange, FileText, MapPinned, Shield, Stethoscope, Users } from 'lucide-react';
import AppointmentCard from '../components/AppointmentCard';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import RecordCard from '../components/RecordCard';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import VillageScheduleCard from '../components/VillageScheduleCard';
import DashboardLayout from '../layouts/DashboardLayout';
import { fetchAppointments } from '../api/appointments';
import { fetchAvailability } from '../api/availability';
import { fetchDoctors } from '../api/doctors';
import { fetchRecords } from '../api/records';
import { fetchReportSummary } from '../api/reports';
import { sortAppointments, sortSlots } from '../utils/formatters';

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [apptData, recordData, doctorData, availabilityData, reportData] = await Promise.all([
          fetchAppointments(),
          fetchRecords(),
          fetchDoctors(),
          fetchAvailability(),
          fetchReportSummary().catch(() => null)
        ]);
        setAppointments(sortAppointments(apptData || []));
        setRecords(recordData || []);
        setDoctors(doctorData || []);
        setAvailability(sortSlots(availabilityData || []));
        setReport(reportData);
      } catch (err) {
        setError(err.response?.data?.message || 'We could not load admin data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const appointmentCounts = report?.appointments || appointments.reduce((acc, item) => ({ ...acc, [item.status]: (acc[item.status] || 0) + 1 }), {});
  const uniquePatients = useMemo(() => new Set(appointments.map((item) => item.patientId)).size, [appointments]);

  const stats = [
    { label: 'Total patients', value: uniquePatients, icon: Users },
    { label: 'Total doctors', value: doctors.length, icon: Shield },
    { label: 'Booked appointments', value: appointmentCounts.booked || 0, icon: CalendarRange },
    { label: 'Upcoming village visits', value: availability.length, icon: MapPinned },
    { label: 'Medical records', value: report?.totalRecords ?? records.length, icon: Activity }
  ];

  return (
    <DashboardLayout role="admin" title="Admin Dashboard" subtitle="Operational overview for Arogya Rural">
      <PageHeader
        eyebrow="Admin control"
        title="Monitor rural healthcare activity without fake analytics"
        text="This dashboard shows counts and recent activity from the Spring Boot APIs that are currently available."
      />

      {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Recent Appointments">
          {loading ? (
            <p className="text-sm text-slate-600">Loading appointments...</p>
          ) : appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.slice(0, 5).map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} role="admin" />
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarRange} title="No appointments yet" text="Appointments will appear after patients book doctor slots." />
          )}
        </SectionCard>

        <SectionCard title="Specialization Report">
          {report?.bySpecialization?.length ? (
            <div className="space-y-3">
              {report.bySpecialization.map((item) => (
                <div key={item.name} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-950">{item.name}</p>
                    <span className="rounded-md bg-brand-50 px-2.5 py-1 text-sm font-semibold text-brand-800">
                      {item.doctors} doctors
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Stethoscope} title="No specialization report yet" text="The report appears when doctor profiles exist." />
          )}
        </SectionCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Upcoming Village Visits">
          {loading ? (
            <p className="text-sm text-slate-600">Loading visits...</p>
          ) : availability.length > 0 ? (
            <div className="space-y-3">
              {availability.slice(0, 4).map((slot) => (
                <VillageScheduleCard key={slot.id} slot={slot} />
              ))}
            </div>
          ) : (
            <EmptyState icon={MapPinned} title="No upcoming village visits" text="Doctor-published schedules will appear here." />
          )}
        </SectionCard>

        <SectionCard title="Recent Medical Records">
          {loading ? (
            <p className="text-sm text-slate-600">Loading records...</p>
          ) : records.length > 0 ? (
            <div className="space-y-3">
              {records.slice(0, 3).map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}
            </div>
          ) : (
            <EmptyState icon={FileText} title="No medical records yet" text="Records appear after doctors complete visits." />
          )}
        </SectionCard>
      </section>
    </DashboardLayout>
  );
}

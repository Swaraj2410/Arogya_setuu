import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Search } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import RecordCard from '../components/RecordCard';
import SectionCard from '../components/SectionCard';
import DashboardLayout from '../layouts/DashboardLayout';
import { fetchRecords } from '../api/records';
import { useAuth } from '../state/AuthContext';

export default function MedicalRecordsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [date, setDate] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchRecords({
          patientId: user?.role === 'patient' ? user?.patientId : undefined,
          doctorId: user?.role === 'doctor' ? user?.doctorId : undefined,
          date: date || undefined,
          q: query || undefined
        });
        setRecords(data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'We could not load medical records.');
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [date, query, user?.id, user?.role, user?.patientId, user?.doctorId]);

  const filtered = useMemo(() => records, [records]);

  return (
    <DashboardLayout
      role={user?.role || 'patient'}
      title="Medical Records"
      subtitle="Secure consultation history and linked prescriptions"
    >
      <PageHeader
        eyebrow="Medical timeline"
        title={user?.role === 'doctor' ? 'Patient records' : 'Your medical records'}
        text="Consultation records appear after a doctor completes a visit. Prescriptions remain linked to each record."
      />

      <SectionCard title="Search Records" action={<span className="text-sm text-slate-500">{filtered.length} records</span>}>
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="block text-sm font-medium text-slate-700">
            Keyword
            <div className="relative mt-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Diagnosis, treatment, notes"
                className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm"
              />
            </div>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Visit date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            />
          </label>
        </div>
      </SectionCard>

      {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-600">Loading medical records...</p>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No medical records yet"
          text="Your consultation records will appear here after your doctor adds them."
        />
      )}
    </DashboardLayout>
  );
}

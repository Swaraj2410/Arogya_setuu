import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Stethoscope } from 'lucide-react';
import DoctorCard from '../components/DoctorCard';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import DashboardLayout from '../layouts/DashboardLayout';
import { fetchAvailability } from '../api/availability';
import { fetchDoctors } from '../api/doctors';
import { useAuth } from '../state/AuthContext';
import { specializations } from '../data/specializations';
import { firstOpenSlot, formatLocation, normalizeDoctor, sortSlots } from '../utils/formatters';

export default function DoctorsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [slotsByDoctor, setSlotsByDoctor] = useState({});
  const [filters, setFilters] = useState({ q: '', specializationId: '', location: '', availableOnly: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchDoctors(filters.specializationId ? { specialization: filters.specializationId } : {});
        const normalized = (data || []).map(normalizeDoctor);
        setDoctors(normalized);
        const pairs = await Promise.all(
          normalized.map(async (doctor) => {
            try {
              const slots = await fetchAvailability({ doctorId: doctor.id });
              return [doctor.id, sortSlots(slots || [])];
            } catch (_) {
              return [doctor.id, []];
            }
          })
        );
        setSlotsByDoctor(Object.fromEntries(pairs));
      } catch (err) {
        setError(err.response?.data?.message || 'We could not load doctors.');
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters.specializationId]);

  const filteredDoctors = useMemo(() => {
    const query = filters.q.trim().toLowerCase();
    const location = filters.location.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const next = firstOpenSlot(slotsByDoctor[doctor.id] || []);
      const haystack = `${doctor.name} ${doctor.specializationName}`.toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (filters.availableOnly && !next) return false;
      if (location && !formatLocation(next || {}).toLowerCase().includes(location)) return false;
      return true;
    });
  }, [doctors, filters, slotsByDoctor]);

  return (
    <DashboardLayout role={user?.role || 'patient'} title="Find Doctors" subtitle="Search doctors and view published village schedules">
      <PageHeader
        eyebrow="Doctor discovery"
        title="Find the right doctor for your village visit"
        text="Doctor cards show the next published village visit when one is available."
      />

      <SectionCard
        title="Filters"
        action={
          <span className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            <SlidersHorizontal size={16} aria-hidden="true" />
            {filteredDoctors.length} doctors
          </span>
        }
      >
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
          <label className="block text-sm font-medium text-slate-700">
            Search
            <div className="relative mt-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                value={filters.q}
                onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
                className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm"
                placeholder="Doctor name or specialization"
              />
            </div>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Specialization
            <select
              value={filters.specializationId}
              onChange={(event) => setFilters((current) => ({ ...current, specializationId: event.target.value }))}
              className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">All</option>
              {specializations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Location
            <input
              value={filters.location}
              onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))}
              className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              placeholder="Village or taluka"
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={filters.availableOnly}
              onChange={(event) => setFilters((current) => ({ ...current, availableOnly: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-700"
            />
            Available only
          </label>
        </div>
      </SectionCard>

      {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-600">Loading doctors and schedules...</p>
      ) : filteredDoctors.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              nextSlot={firstOpenSlot(slotsByDoctor[doctor.id] || [])}
              onSchedule={() => navigate(`/doctors/${doctor.id}`)}
              onBook={() => navigate('/appointments')}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Stethoscope}
          title="No doctors match these filters"
          text="Try a different specialization, village, or availability filter."
        />
      )}
    </DashboardLayout>
  );
}

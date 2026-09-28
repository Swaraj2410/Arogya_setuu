import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, MapPinned, Plus, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import LocationSelect from '../components/LocationSelect';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import VillageScheduleCard from '../components/VillageScheduleCard';
import DashboardLayout from '../layouts/DashboardLayout';
import { createAvailability, deleteAvailability, fetchAvailability } from '../api/availability';
import { useAuth } from '../state/AuthContext';
import {
  formatDate,
  formatLocation,
  formatTime,
  getLocalDateISO,
  hasCompleteLocation,
  locationParams,
  sortSlots
} from '../utils/formatters';

const today = getLocalDateISO();

export default function VillageVisitsPage({ mode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'patient';
  const isDoctor = mode === 'doctor' || role === 'doctor';
  const patientLocation = locationParams(user?.patientProfile || {});
  const [slots, setSlots] = useState([]);
  const [filters, setFilters] = useState({ date: '' });
  const [form, setForm] = useState({
    state: '',
    district: '',
    taluka: '',
    village: '',
    availableDate: today,
    startTime: '',
    endTime: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        date: filters.date || undefined,
        doctorId: isDoctor ? user?.doctorId : undefined,
        ...(!isDoctor && hasCompleteLocation(patientLocation) ? patientLocation : {})
      };
      const data = await fetchAvailability(params);
      setSlots(sortSlots(data || []));
    } catch (err) {
      setError(err.response?.data?.message || 'We could not load village visits.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.date, isDoctor, user?.doctorId]);

  const grouped = useMemo(() => {
    const upcoming = slots.filter((slot) => slot.availableDate >= today);
    const past = slots.filter((slot) => slot.availableDate < today);
    return {
      today: upcoming.filter((slot) => slot.availableDate === today),
      upcoming: upcoming.filter((slot) => slot.availableDate !== today),
      past
    };
  }, [slots]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const created = await createAvailability({ doctorId: user?.doctorId, ...form });
      setSlots((current) => sortSlots([created, ...current]));
      setForm((current) => ({ ...current, state: '', district: '', taluka: '', village: '', startTime: '', endTime: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'We could not publish this village visit.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slot) => {
    if (!window.confirm('Delete this village visit?')) return;
    setDeletingId(slot.id);
    setError('');
    try {
      await deleteAvailability(slot.id);
      setSlots((current) => current.filter((item) => item.id !== slot.id));
    } catch (err) {
      setError(err.response?.data?.message || 'We could not delete this village visit.');
    } finally {
      setDeletingId(null);
    }
  };

  const scheduleList = (items, emptyTitle, emptyText) =>
    loading ? (
      <p className="text-sm text-slate-600">Loading village visits...</p>
    ) : items.length > 0 ? (
      <div className="grid gap-3">
        {items.map((slot) => (
          <VillageScheduleCard
            key={slot.id}
            slot={slot}
            showDoctor={!isDoctor}
            onBook={!isDoctor ? () => navigate('/appointments') : undefined}
            onDelete={isDoctor ? handleDelete : undefined}
            deleting={deletingId === slot.id}
          />
        ))}
      </div>
    ) : (
      <EmptyState icon={MapPinned} title={emptyTitle} text={emptyText} />
    );

  return (
    <DashboardLayout
      role={role}
      title={isDoctor ? 'Village Schedule' : 'Doctors Visiting Your Village'}
      subtitle={isDoctor ? 'Plan and manage dynamic village visits' : 'Published doctor visits for your registered village'}
    >
      <PageHeader
        eyebrow={isDoctor ? 'Core doctor workflow' : 'Village schedule'}
        title={isDoctor ? 'Plan a Village Visit' : 'Doctors Visiting Your Village'}
        text={
          isDoctor
            ? 'Publish exactly where and when you will visit. Patients in that village can discover and book open slots.'
            : 'Your registered village location is used to find doctor visit schedules.'
        }
        meta={
          !isDoctor && (
            <span className="inline-flex items-center gap-2 rounded-md bg-field-50 px-3 py-2 text-sm font-semibold text-field-700">
              <MapPinned size={16} aria-hidden="true" />
              {formatLocation(patientLocation)}
            </span>
          )
        }
      />

      {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

      {isDoctor && (
        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard title="Publish Village Visit">
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <LocationSelect
                value={form}
                onChange={(location) => setForm((current) => ({ ...current, ...location }))}
                required
                inputClassName="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                labelClassName="text-sm font-medium text-slate-700"
              />
              <label className="block text-sm font-medium text-slate-700">
                Date
                <input
                  type="date"
                  min={today}
                  value={form.availableDate}
                  onChange={(event) => setForm((current) => ({ ...current, availableDate: event.target.value }))}
                  className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Start Time
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
                  className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                End Time
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
                  className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  required
                />
              </label>
              <div className="sm:col-span-2">
                <Button type="submit" icon={Plus} disabled={saving || !hasCompleteLocation(form)}>
                  {saving ? 'Publishing...' : 'Publish Schedule'}
                </Button>
              </div>
            </form>
          </SectionCard>

          <Card className="p-5">
            <p className="text-sm font-semibold text-brand-700">Preview</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-slate-950">You are planning to visit</h3>
            <div className="mt-5 rounded-lg border border-field-100 bg-field-50 p-4">
              <p className="flex items-center gap-2 font-semibold text-field-700">
                <MapPinned size={18} aria-hidden="true" />
                {formatLocation(form, 'Select village location')}
              </p>
              <p className="mt-3 text-sm text-slate-700">{formatDate(form.availableDate)}</p>
              <p className="text-sm text-slate-700">
                {form.startTime ? formatTime(form.startTime) : 'Start time'} - {form.endTime ? formatTime(form.endTime) : 'End time'}
              </p>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Check the village and timing before publishing. Patients use this schedule for bookings.
            </p>
          </Card>
        </section>
      )}

      <SectionCard
        title={isDoctor ? 'Schedule List' : 'Upcoming Visits'}
        action={
          <label className="text-sm font-medium text-slate-700">
            <span className="sr-only">Filter by date</span>
            <input
              type="date"
              value={filters.date}
              onChange={(event) => setFilters({ date: event.target.value })}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            />
          </label>
        }
      >
        {isDoctor ? (
          <div className="space-y-5">
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CalendarDays size={16} aria-hidden="true" />
                Today's Visit
              </h3>
              {scheduleList(grouped.today, 'No visit planned today', 'Today stays open until you publish a village visit.')}
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Upcoming Visits</h3>
              {scheduleList(grouped.upcoming, 'No upcoming visits', 'Plan the next village visit when your schedule is ready.')}
            </div>
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Trash2 size={16} aria-hidden="true" />
                Past Visits
              </h3>
              {scheduleList(grouped.past, 'No past visits yet', 'Completed village visit history will appear here.')}
            </div>
          </div>
        ) : !hasCompleteLocation(patientLocation) ? (
          <EmptyState
            icon={MapPinned}
            title="Your village location is missing"
            text="Update your patient profile details during registration so Arogya Rural can show village visits."
          />
        ) : (
          scheduleList(slots, 'No doctor visit is scheduled for your village yet', 'You can explore doctors in nearby locations or check again later.')
        )}
      </SectionCard>
    </DashboardLayout>
  );
}

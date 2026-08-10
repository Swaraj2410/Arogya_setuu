import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock, XCircle } from 'lucide-react';
import AppointmentCard from '../components/AppointmentCard';
import AppointmentForm from '../components/AppointmentForm';
import Badge from '../components/Badge';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import DashboardLayout from '../layouts/DashboardLayout';
import { createAppointment, deleteAppointment, fetchAppointments, updateAppointment } from '../api/appointments';
import { fetchAvailability } from '../api/availability';
import { useAuth } from '../state/AuthContext';
import { formatShortLocation, formatTimeRange, getLocalDateISO, sortAppointments } from '../utils/formatters';

const tabs = [
  { key: 'booked', label: 'Upcoming', icon: Clock },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle }
];

export default function AppointmentPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('booked');
  const [date, setDate] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '' });
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAppointments({
        date: date || undefined,
        doctorId: user?.role === 'doctor' ? user?.doctorId : undefined,
        patientId: user?.role === 'patient' ? user?.patientId : undefined
      });
      setItems(sortAppointments(data || []));
    } catch (err) {
      setError(err.response?.data?.message || 'We could not load your appointments.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, user?.id]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!rescheduleTarget || !rescheduleForm.date) {
        setSlots([]);
        return;
      }
      setSlotsLoading(true);
      setError('');
      try {
        const data = await fetchAvailability({ doctorId: rescheduleTarget.doctorId, date: rescheduleForm.date });
        setSlots((data || []).filter((slot) => !slot.isBooked));
      } catch (err) {
        setError(err.response?.data?.message || 'We could not load open slots.');
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    loadSlots();
  }, [rescheduleTarget, rescheduleForm.date]);

  const counts = useMemo(
    () =>
      tabs.reduce(
        (acc, tab) => ({
          ...acc,
          [tab.key]: items.filter((item) => item.status === tab.key).length
        }),
        {}
      ),
    [items]
  );

  const visibleItems = useMemo(() => items.filter((item) => item.status === activeTab), [items, activeTab]);

  const handleBook = async (appointment) => {
    setError('');
    try {
      const created = await createAppointment(appointment);
      setItems((list) => sortAppointments([created, ...list]));
      return created;
    } catch (err) {
      setError(err.response?.data?.message || 'We could not book this appointment.');
      throw err;
    }
  };

  const handleDelete = async (appointment) => {
    if (!window.confirm('Delete this appointment?')) return;
    setDeletingId(appointment.id);
    setError('');
    try {
      await deleteAppointment(appointment.id);
      setItems((list) => list.filter((item) => item.id !== appointment.id));
    } catch (err) {
      setError(err.response?.data?.message || 'We could not delete this appointment.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = async (appointment) => {
    if (!window.confirm('Cancel this appointment?')) return;
    setUpdatingId(appointment.id);
    setError('');
    try {
      const updated = await updateAppointment(appointment.id, { status: 'cancelled' });
      setItems((list) => list.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err.response?.data?.message || 'We could not cancel this appointment.');
    } finally {
      setUpdatingId(null);
    }
  };

  const startReschedule = (appointment) => {
    setRescheduleTarget(appointment);
    setRescheduleForm({ date: appointment.appointmentDate, time: '' });
  };

  const handleReschedule = async (event) => {
    event.preventDefault();
    if (!rescheduleTarget || !rescheduleForm.date || !rescheduleForm.time) return;
    setUpdatingId(rescheduleTarget.id);
    setError('');
    try {
      const updated = await updateAppointment(rescheduleTarget.id, {
        appointmentDate: rescheduleForm.date,
        appointmentTime: rescheduleForm.time
      });
      setItems((list) => sortAppointments(list.map((item) => (item.id === updated.id ? updated : item))));
      setRescheduleTarget(null);
      setRescheduleForm({ date: '', time: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'We could not reschedule this appointment.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardLayout role={user?.role || 'patient'} title="Appointments" subtitle="Book, reschedule, and track care visits">
      <PageHeader
        eyebrow="Appointment booking"
        title={user?.role === 'patient' ? 'Book and manage your appointments' : 'Appointment queue'}
        text={
          user?.role === 'patient'
            ? 'Choose a doctor, date, and open village visit slot. You will see a confirmation summary before booking.'
            : 'Review patient appointments by status and date.'
        }
      />

      {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

      {user?.role === 'patient' && (
        <SectionCard
          title="Book Appointment"
          action={<Badge label={`${items.filter((item) => item.status === 'booked').length} active`} variant="booked" />}
        >
          <AppointmentForm onBook={handleBook} />
        </SectionCard>
      )}

      {rescheduleTarget && (
        <SectionCard
          title="Reschedule Appointment"
          action={
            <Button variant="secondary" size="sm" onClick={() => setRescheduleTarget(null)}>
              Close
            </Button>
          }
        >
          <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleReschedule}>
            <label className="block text-sm font-medium text-slate-700">
              Date
              <input
                type="date"
                min={getLocalDateISO()}
                value={rescheduleForm.date}
                onChange={(event) => setRescheduleForm({ date: event.target.value, time: '' })}
                className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Slot
              <select
                value={rescheduleForm.time}
                onChange={(event) => setRescheduleForm((current) => ({ ...current, time: event.target.value }))}
                className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                disabled={slotsLoading}
                required
              >
                <option value="">{slotsLoading ? 'Loading slots...' : 'Select slot'}</option>
                {slots.map((slot) => (
                  <option key={slot.id} value={slot.startTime}>
                    {formatTimeRange(slot)} - {formatShortLocation(slot)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <Button type="submit" disabled={updatingId === rescheduleTarget.id}>
                Save
              </Button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard
        title="My Appointments"
        action={
          <label className="block text-sm font-medium text-slate-700">
            <span className="sr-only">Filter by date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            />
          </label>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold ${
                  activeTab === tab.key ? 'border-brand-200 bg-brand-50 text-brand-800' : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                {tab.label}
                <span className="rounded bg-white px-1.5 py-0.5 text-xs">{counts[tab.key] || 0}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="text-sm text-slate-600">Loading appointments...</p>
        ) : visibleItems.length > 0 ? (
          <div className="grid gap-3">
            {visibleItems.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                role={user?.role}
                onCancel={user?.role === 'patient' ? handleCancel : undefined}
                onDelete={user?.role === 'patient' ? handleDelete : undefined}
                onReschedule={user?.role === 'patient' ? startReschedule : undefined}
                deleting={deletingId === appointment.id}
                updating={updatingId === appointment.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title={`No ${tabs.find((tab) => tab.key === activeTab)?.label.toLowerCase()} appointments`}
            text="Appointments will appear here when they match the selected status and date."
          />
        )}
      </SectionCard>
    </DashboardLayout>
  );
}

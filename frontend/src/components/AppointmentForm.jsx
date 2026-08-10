import React, { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, MapPin, Send } from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import { fetchDoctors } from '../api/doctors';
import { fetchAvailability } from '../api/availability';
import Button from './Button';
import EmptyState from './EmptyState';
import { LoadingSpinner } from './LoadingState';
import {
  formatDate,
  formatShortLocation,
  formatTimeRange,
  getLocalDateISO,
  getDoctorName,
  getSpecializationName,
  normalizeDoctor
} from '../utils/formatters';

const today = getLocalDateISO();

export default function AppointmentForm({ onBook, defaultDoctorId = '', defaultDate = '', compact = false }) {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    specializationId: '',
    doctorId: defaultDoctorId,
    date: defaultDate,
    time: '',
    reason: ''
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchDoctors();
        setDoctors((data || []).map(normalizeDoctor));
      } catch (err) {
        setError(err.response?.data?.message || 'We could not load doctors right now.');
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      doctorId: defaultDoctorId || current.doctorId,
      date: defaultDate || current.date
    }));
  }, [defaultDoctorId, defaultDate]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!form.doctorId || !form.date) {
        setSlots([]);
        return;
      }
      setSlotsLoading(true);
      setError('');
      try {
        const data = await fetchAvailability({ doctorId: form.doctorId, date: form.date });
        setSlots((data || []).filter((slot) => !slot.isBooked));
      } catch (err) {
        setError(err.response?.data?.message || 'We could not load open slots for this doctor.');
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    loadSlots();
  }, [form.doctorId, form.date]);

  const specializationOptions = useMemo(() => {
    const byId = new Map();
    doctors.forEach((doctor) => {
      if (doctor.specializationId) byId.set(doctor.specializationId, doctor.specializationName);
    });
    return Array.from(byId, ([id, name]) => ({ id, name }));
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    if (!form.specializationId) return doctors;
    return doctors.filter((doctor) => String(doctor.specializationId) === String(form.specializationId));
  }, [form.specializationId, doctors]);

  const selectedDoctor = doctors.find((doctor) => String(doctor.id) === String(form.doctorId));
  const selectedSlot = slots.find((slot) => slot.startTime === form.time);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.doctorId || !form.date || !form.time) return;
    setBooking(true);
    setSuccess(null);
    try {
      const payload = {
        patientId: user?.patientId || user?.id,
        doctorId: Number(form.doctorId),
        appointmentDate: form.date,
        appointmentTime: form.time,
        status: 'booked',
        reason: form.reason || 'General consultation'
      };
      const created = await onBook(payload);
      setSuccess({
        ...payload,
        id: created?.id,
        doctor: selectedDoctor,
        slot: selectedSlot
      });
      setForm({ specializationId: '', doctorId: '', date: '', time: '', reason: '' });
      setSlots([]);
    } catch (_) {
      // Parent page exposes the backend error.
    } finally {
      setBooking(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
        <p className="flex items-center gap-2 text-lg font-semibold text-emerald-800">
          <CalendarCheck size={22} aria-hidden="true" />
          Appointment Confirmed
        </p>
        <div className="mt-3 grid gap-1 text-sm text-emerald-900">
          <span>{getDoctorName(success.doctor)}</span>
          <span>{formatDate(success.appointmentDate)} at {success.appointmentTime}</span>
          <span>{success.slot ? formatShortLocation(success.slot) : 'Village schedule selected'}</span>
        </div>
        <Button variant="secondary" className="mt-4" onClick={() => setSuccess(null)}>
          Book another appointment
        </Button>
      </div>
    );
  }

  return (
    <form className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Specialization
            <select
              className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={form.specializationId}
              onChange={(event) => setForm((current) => ({ ...current, specializationId: event.target.value, doctorId: '', time: '' }))}
            >
              <option value="">Any specialization</option>
              {specializationOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Doctor
            <select
              className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={form.doctorId}
              onChange={(event) => setForm((current) => ({ ...current, doctorId: event.target.value, time: '' }))}
              required
              disabled={loading}
            >
              <option value="">{loading ? 'Loading doctors...' : 'Select doctor'}</option>
              {filteredDoctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {getDoctorName(doctor)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Visit date
            <input
              type="date"
              min={today}
              className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value, time: '' }))}
              required
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Open slot
            <select
              className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={form.time}
              onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
              required
              disabled={!form.doctorId || !form.date || slotsLoading}
            >
              <option value="">
                {slotsLoading ? 'Loading slots...' : form.doctorId && form.date ? 'Select slot' : 'Select doctor and date'}
              </option>
              {slots.map((slot) => (
                <option key={slot.id} value={slot.startTime}>
                  {formatTimeRange(slot)} - {formatShortLocation(slot)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Reason for visit
          <textarea
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            value={form.reason}
            onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
            rows={compact ? 2 : 4}
            placeholder="Describe the concern in simple words"
          />
        </label>

        {error && <p className="text-sm font-medium text-rose-700">{error}</p>}
        {slotsLoading && <LoadingSpinner label="Finding open slots" />}
        {form.doctorId && form.date && !slotsLoading && slots.length === 0 && (
          <EmptyState
            title="No open slots for this date"
            text="Try another date or check the doctor's upcoming village schedule."
          />
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-950">Booking summary</p>
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <p>
            <span className="font-semibold text-slate-950">Doctor: </span>
            {selectedDoctor ? `${getDoctorName(selectedDoctor)} - ${getSpecializationName(selectedDoctor)}` : 'Select doctor'}
          </p>
          <p>
            <span className="font-semibold text-slate-950">Date and time: </span>
            {form.date ? formatDate(form.date) : 'Select date'} {form.time ? `at ${form.time}` : ''}
          </p>
          <p className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 text-field-700" aria-hidden="true" />
            {selectedSlot ? formatShortLocation(selectedSlot) : 'Village appears after selecting a slot'}
          </p>
        </div>
        <Button type="submit" icon={Send} disabled={booking || !form.doctorId || !form.date || !form.time} className="mt-5 w-full">
          {booking ? 'Confirming...' : 'Confirm Appointment'}
        </Button>
      </div>
    </form>
  );
}

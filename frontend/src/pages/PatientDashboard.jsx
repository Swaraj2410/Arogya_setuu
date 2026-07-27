import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, FileText, MapPin, Stethoscope, X } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/StatCard';
import AppointmentCard from '../components/AppointmentCard';
import SectionCard from '../components/SectionCard';
import { useAuth } from '../state/AuthContext';
import { fetchAppointments } from '../api/appointments';
import { fetchAvailability } from '../api/availability';
import { fetchRecords } from '../api/records';
import { fetchDoctors } from '../api/doctors';
import {
  formatDate,
  formatLocation,
  formatShortLocation,
  formatTimeRange,
  getLocalDateISO,
  hasCompleteLocation,
  locationParams,
  timeToMinutes
} from '../utils/formatters';

const sortByDateAndTime = (items = []) =>
  [...items].sort((a, b) => `${a.availableDate} ${a.startTime}`.localeCompare(`${b.availableDate} ${b.startTime}`));

const normalizeDoctor = (doctor) => ({
  id: doctor.id,
  name: doctor.User?.name || doctor.name,
  specializationId: doctor.specializationId || doctor.specialization_id || doctor.Specialization?.id,
  specializationName: doctor.Specialization?.name || doctor.specializationName || 'Specialist',
  experienceYears: doctor.experienceYears || doctor.experience_years,
  consultationFee: doctor.consultationFee || doctor.consultation_fee
});

const getDoctorScheduleSummary = (slots = []) => {
  const ordered = sortByDateAndTime(slots);
  const today = getLocalDateISO();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const active = ordered.find((slot) => {
    const start = timeToMinutes(slot.startTime);
    const end = timeToMinutes(slot.endTime);
    return slot.availableDate === today && start !== null && end !== null && currentMinutes >= start && currentMinutes <= end;
  });

  if (active) {
    return {
      title: `Currently scheduled in ${formatShortLocation(active)}`,
      when: `Today, ${formatTimeRange(active)}`,
      slot: active,
      showTrackingNote: true
    };
  }

  const laterToday = ordered.find((slot) => {
    const start = timeToMinutes(slot.startTime);
    return slot.availableDate === today && start !== null && start > currentMinutes;
  });

  if (laterToday) {
    return {
      title: "Today's next village schedule",
      when: `Today, ${formatTimeRange(laterToday)}`,
      slot: laterToday
    };
  }

  const future = ordered.find((slot) => slot.availableDate > today);
  if (future) {
    return {
      title: 'Next village schedule',
      when: `${formatDate(future.availableDate)}, ${formatTimeRange(future)}`,
      slot: future
    };
  }

  return null;
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [villageSchedules, setVillageSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [doctorScheduleLoading, setDoctorScheduleLoading] = useState(false);
  const [error, setError] = useState('');
  const [schedulesError, setSchedulesError] = useState('');
  const [doctorScheduleError, setDoctorScheduleError] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorSchedule, setDoctorSchedule] = useState([]);
  const patientProfile = user?.patientProfile || {};
  const patientId = user?.role === 'patient' ? user?.patientId || patientProfile.id || user.id : 1;
  const patientLocation = useMemo(
    () => locationParams(patientProfile),
    [patientProfile.state, patientProfile.district, patientProfile.taluka, patientProfile.village]
  );
  const patientHasLocation = hasCompleteLocation(patientLocation);
  const selectedDoctorSummary = getDoctorScheduleSummary(doctorSchedule);

  useEffect(() => {
    const load = async () => {
      if (!patientId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const [apptData, recordData, doctorData] = await Promise.all([
          fetchAppointments({ patientId }),
          fetchRecords({ patientId }),
          fetchDoctors()
        ]);
        setAppointments(apptData);
        setRecords(recordData);
        setDoctors((doctorData || []).map(normalizeDoctor));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load patient workspace data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  useEffect(() => {
    const loadVillageSchedules = async () => {
      setSchedulesError('');
      if (!patientHasLocation) {
        setVillageSchedules([]);
        setSchedulesLoading(false);
        return;
      }

      setSchedulesLoading(true);
      try {
        const data = await fetchAvailability(patientLocation);
        setVillageSchedules(sortByDateAndTime(data || []));
      } catch (err) {
        setSchedulesError(err.response?.data?.message || 'Failed to load village doctor schedules');
        setVillageSchedules([]);
      } finally {
        setSchedulesLoading(false);
      }
    };
    loadVillageSchedules();
  }, [
    patientHasLocation,
    patientLocation.state,
    patientLocation.district,
    patientLocation.taluka,
    patientLocation.village
  ]);

  const myAppointments = appointments.filter((a) => a.patientId === patientId);
  const myRecords = records.filter((r) => r.patientId === patientId);

  const stats = [
    {
      label: 'Upcoming',
      value: myAppointments.filter((a) => a.status === 'booked').length,
      delta: '+2 slots',
      icon: CalendarDays
    },
    { label: 'Medical records', value: myRecords.length, delta: 'Updated weekly', icon: FileText },
    { label: 'Consult doctors', value: doctors.length, delta: 'Available now', icon: Stethoscope }
  ];

  const filteredDoctors = useMemo(() => {
    if (!search) return doctors;
    return doctors.filter((d) => `${d.name} ${d.specializationName}`.toLowerCase().includes(search.toLowerCase()));
  }, [search, doctors]);

  const openDoctorSchedule = async (doctor) => {
    setSelectedDoctor(doctor);
    setDoctorSchedule([]);
    setDoctorScheduleError('');
    setDoctorScheduleLoading(true);
    try {
      const data = await fetchAvailability({ doctorId: doctor.id });
      setDoctorSchedule(sortByDateAndTime(data || []));
    } catch (err) {
      setDoctorScheduleError(err.response?.data?.message || 'Failed to load doctor village schedule');
    } finally {
      setDoctorScheduleLoading(false);
    }
  };

  return (
    <DashboardLayout role="patient" title="Patient workspace" subtitle="Track appointments, village visits, and records">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <SectionCard
        title="Doctor visits in your village"
        action={<span className="text-xs text-slate-500">{formatLocation(patientLocation)}</span>}
      >
        {schedulesLoading ? (
          <p className="text-sm text-slate-500">Loading village schedules...</p>
        ) : schedulesError ? (
          <p className="text-sm text-rose-600">{schedulesError}</p>
        ) : !patientHasLocation ? (
          <p className="text-sm text-slate-500">Location not provided</p>
        ) : villageSchedules.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {villageSchedules.map((slot) => (
              <div key={slot.id} className="rounded-2xl border border-slate-100 bg-white p-4 text-sm shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{slot.Doctor?.User?.name || 'Doctor'}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin size={14} /> {formatLocation(slot)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      slot.isBooked ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {slot.isBooked ? 'Booked' : 'Open'}
                  </span>
                </div>
                <div className="mt-3 grid gap-1 text-slate-600">
                  <p>{formatDate(slot.availableDate)}</p>
                  <p>{formatTimeRange(slot)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1 text-sm text-slate-500">
            <p>No doctor has posted an upcoming schedule for your village.</p>
            <p>You can check individual doctors to see their current or next village schedule.</p>
          </div>
        )}
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Next appointments" action={<p className="text-xs text-slate-500">Updated live</p>}>
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading appointments...</p>
            ) : (
              myAppointments
                .filter((a) => a.status === 'booked')
                .slice(0, 3)
                .map((appt) => <AppointmentCard key={appt.id} appointment={appt} />)
            )}
            {!loading && myAppointments.filter((a) => a.status === 'booked').length === 0 && (
              <p className="text-sm text-slate-500">No bookings yet. Use the Appointment tab to schedule.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent records"
          action={<span className="text-xs text-slate-500">Last updated {myRecords[0]?.visitDate || 'N/A'}</span>}
        >
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading records...</p>
            ) : (
              myRecords.slice(0, 3).map((rec) => (
                <div key={rec.id} className="rounded-2xl border border-slate-100 bg-white p-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{rec.diagnosis}</p>
                  <p className="text-xs text-slate-500">Visit: {rec.visitDate}</p>
                  <p className="mt-1 text-slate-600">Treatment: {rec.treatment}</p>
                </div>
              ))
            )}
            {!loading && myRecords.length === 0 && <p className="text-sm text-slate-500">No records found.</p>}
          </div>
        </SectionCard>

        <SectionCard
          title="Find a doctor"
          action={
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or specialty"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-brand-400 focus:outline-none"
            />
          }
        >
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading doctors...</p>
            ) : (
              filteredDoctors.slice(0, 5).map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => openDoctorSchedule(doc)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-100 p-3 text-left transition hover:border-brand-200 hover:bg-brand-50/40 focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{doc.name}</p>
                    <p className="text-xs text-slate-500">
                      {doc.specializationName} • {doc.experienceYears || 0} yrs exp
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                    ₹{doc.consultationFee || 0}
                  </span>
                </button>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Village schedule</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">{selectedDoctor.name}</h2>
                <p className="text-sm text-slate-500">{selectedDoctor.specializationName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoctor(null)}
                title="Close schedule"
                aria-label="Close schedule"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5">
              {doctorScheduleLoading ? (
                <p className="text-sm text-slate-500">Loading schedule...</p>
              ) : doctorScheduleError ? (
                <p className="text-sm text-rose-600">{doctorScheduleError}</p>
              ) : selectedDoctorSummary ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{selectedDoctorSummary.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{selectedDoctorSummary.when}</p>
                  <p className="mt-2 flex items-center gap-1 text-sm text-slate-600">
                    <MapPin size={15} /> {formatLocation(selectedDoctorSummary.slot)}
                  </p>
                  {selectedDoctorSummary.showTrackingNote && (
                    <p className="mt-3 text-xs text-slate-500">
                      This is the doctor's published schedule, not GPS live tracking.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No upcoming village schedule posted by this doctor.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

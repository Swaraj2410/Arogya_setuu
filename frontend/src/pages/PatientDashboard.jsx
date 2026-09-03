import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Bot, CalendarDays, FileText, MapPin, Pill, Search, Stethoscope } from 'lucide-react';
import AiSymptomAssistant from '../components/AiSymptomAssistant';
import AppointmentCard from '../components/AppointmentCard';
import Button from '../components/Button';
import Card from '../components/Card';
import DoctorCard from '../components/DoctorCard';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import VillageScheduleCard from '../components/VillageScheduleCard';
import DashboardLayout from '../layouts/DashboardLayout';
import { fetchAppointments } from '../api/appointments';
import { fetchAvailability } from '../api/availability';
import { fetchDoctors } from '../api/doctors';
import { fetchNotifications } from '../api/notifications';
import { fetchRecords } from '../api/records';
import { useAuth } from '../state/AuthContext';
import {
  firstOpenSlot,
  formatDate,
  formatLocation,
  formatTimeRange,
  hasCompleteLocation,
  locationParams,
  normalizeDoctor,
  sortAppointments,
  sortSlots
} from '../utils/formatters';

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [villageSchedules, setVillageSchedules] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [doctorSlots, setDoctorSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [error, setError] = useState('');

  const patientProfile = user?.patientProfile || {};
  const patientId = user?.patientId || patientProfile.id;
  const patientLocation = useMemo(() => locationParams(patientProfile), [patientProfile]);
  const patientHasLocation = hasCompleteLocation(patientLocation);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [apptData, recordData, doctorData, notificationData] = await Promise.all([
          fetchAppointments({ patientId }),
          fetchRecords({ patientId }),
          fetchDoctors(),
          fetchNotifications().catch(() => [])
        ]);
        const normalizedDoctors = (doctorData || []).map(normalizeDoctor);
        setAppointments(sortAppointments(apptData || []));
        setRecords(recordData || []);
        setDoctors(normalizedDoctors);
        setNotifications(notificationData || []);

        const slotPairs = await Promise.all(
          normalizedDoctors.slice(0, 6).map(async (doctor) => {
            try {
              const slots = await fetchAvailability({ doctorId: doctor.id });
              return [doctor.id, sortSlots(slots || [])];
            } catch (_) {
              return [doctor.id, []];
            }
          })
        );
        setDoctorSlots(Object.fromEntries(slotPairs));
      } catch (err) {
        setError(err.response?.data?.message || 'We could not load your patient workspace.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  useEffect(() => {
    const loadVillageSchedules = async () => {
      setScheduleLoading(true);
      if (!patientHasLocation) {
        setVillageSchedules([]);
        setScheduleLoading(false);
        return;
      }
      try {
        const data = await fetchAvailability(patientLocation);
        setVillageSchedules(sortSlots(data || []));
      } catch (_) {
        setVillageSchedules([]);
      } finally {
        setScheduleLoading(false);
      }
    };
    loadVillageSchedules();
  }, [patientHasLocation, patientLocation.state, patientLocation.district, patientLocation.taluka, patientLocation.village]);

  const upcomingAppointments = appointments.filter((item) => item.status === 'booked');
  const unread = notifications.filter((item) => !item.isRead).length;
  const prioritySlot = firstOpenSlot(villageSchedules);
  const priorityDoctor = prioritySlot?.Doctor;

  const statCards = [
    { label: 'Village visits', value: villageSchedules.length, icon: MapPin, delta: patientProfile.village || 'Your village' },
    { label: 'Upcoming appointments', value: upcomingAppointments.length, icon: CalendarDays },
    { label: 'Medical records', value: records.length, icon: FileText },
    { label: 'Unread notifications', value: unread, icon: Bell, color: 'bg-earth-50 text-earth-600' }
  ];

  return (
    <DashboardLayout role="patient" title="Healthcare around your village" subtitle="Find visits, book care, and view records">
      <PageHeader
        eyebrow="Patient home"
        title={`Good ${new Date().getHours() < 12 ? 'morning' : 'day'}, ${user?.name?.split(' ')[0] || 'there'}`}
        text="Your dashboard focuses on doctors visiting your village and the care actions you need next."
        meta={
          <span className="inline-flex items-center gap-2 rounded-md bg-field-50 px-3 py-2 text-sm font-semibold text-field-700">
            <MapPin size={16} aria-hidden="true" />
            {formatLocation(patientLocation)}
          </span>
        }
      />

      {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-brand-900 p-5 text-white sm:p-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-earth-200">
                <MapPin size={17} aria-hidden="true" />
                Upcoming Doctor Visit
              </p>
              {prioritySlot ? (
                <>
                  <h2 className="mt-4 font-display text-3xl font-semibold">{priorityDoctor?.User?.name || 'Doctor visiting your village'}</h2>
                  <p className="mt-2 text-brand-50">{priorityDoctor?.Specialization?.name || 'Healthcare consultation'}</p>
                  <div className="mt-5 space-y-2 text-sm text-brand-50">
                    <p>{formatLocation(prioritySlot)}</p>
                    <p>{formatDate(prioritySlot.availableDate)}</p>
                    <p>{formatTimeRange(prioritySlot)}</p>
                  </div>
                  <Button as={Link} to="/appointments" variant="warm" className="mt-6">
                    Book Appointment
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="mt-4 font-display text-3xl font-semibold">No doctor visit is scheduled for your village yet</h2>
                  <p className="mt-3 text-sm leading-6 text-brand-50">
                    Check the village visits page again later or explore doctors and their latest published schedules.
                  </p>
                  <Button as={Link} to="/doctors" variant="warm" className="mt-6">
                    Find Doctors
                  </Button>
                </>
              )}
            </div>
            <div className="medical-grid p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { to: '/doctors', icon: Search, title: 'Find Doctors', text: 'Search by name or specialization.' },
                  { to: '/village-visits', icon: MapPin, title: 'Village Visits', text: 'See schedules for your village.' },
                  { to: '/records', icon: FileText, title: 'Medical Records', text: 'Review consultation history.' },
                  { to: '/ai-assistant', icon: Bot, title: 'AI Health Assistant', text: 'Symptom triage and doctor routing.' }
                ].map((item) => (
                  <Link key={item.to} to={item.to} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-200">
                    <item.icon size={20} className="text-brand-700" aria-hidden="true" />
                    <p className="mt-3 font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{item.text}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <SectionCard title="My Upcoming Appointment">
          {loading ? (
            <p className="text-sm text-slate-600">Loading appointments...</p>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.slice(0, 2).map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No appointment booked yet"
              text="Book a doctor visit when an open slot is available for your village."
              action={
                <Button as={Link} to="/appointments" variant="secondary">
                  Book appointment
                </Button>
              }
            />
          )}
        </SectionCard>
      </section>

      <AiSymptomAssistant compact doctorLimit={2} />

      <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <SectionCard
          title="Upcoming Village Visits"
          action={
            <Button as={Link} to="/village-visits" variant="secondary" size="sm">
              View all
            </Button>
          }
        >
          {scheduleLoading ? (
            <p className="text-sm text-slate-600">Loading village visits...</p>
          ) : villageSchedules.length > 0 ? (
            <div className="grid gap-3">
              {villageSchedules.slice(0, 3).map((slot) => (
                <VillageScheduleCard key={slot.id} slot={slot} onBook={() => navigate('/appointments')} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={MapPin}
              title="No doctor visit is scheduled for your village yet"
              text="You can explore doctors in nearby areas or check again after doctors publish new village visits."
            />
          )}
        </SectionCard>

        <SectionCard title="Find Doctors">
          {loading ? (
            <p className="text-sm text-slate-600">Loading doctors...</p>
          ) : doctors.length > 0 ? (
            <div className="space-y-3">
              {doctors.slice(0, 2).map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  nextSlot={firstOpenSlot(doctorSlots[doctor.id] || [])}
                  onSchedule={() => navigate(`/doctors/${doctor.id}`)}
                  onBook={() => navigate('/appointments')}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={Stethoscope} title="No doctors available yet" text="Doctor profiles will appear after registration." />
          )}
        </SectionCard>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: '/records', icon: FileText, title: 'Medical Records', count: records.length },
          {
            to: '/prescriptions',
            icon: Pill,
            title: 'Prescriptions',
            count: records.reduce((total, record) => total + ((record.Prescriptions || record.prescriptions || []).length), 0)
          },
          { to: '/notifications', icon: Bell, title: 'Notifications', count: notifications.length },
          { to: '/ai-assistant', icon: Bot, title: 'AI Assistant', count: 'Ready' }
        ].map((item) => (
          <Link key={item.to} to={item.to} className="rounded-lg border border-slate-200 bg-white p-4 shadow-card hover:border-brand-200">
            <item.icon size={21} className="text-brand-700" aria-hidden="true" />
            <p className="mt-3 font-semibold text-slate-950">{item.title}</p>
            <p className="mt-1 text-sm text-slate-600">{typeof item.count === 'number' ? `${item.count} items` : item.count}</p>
          </Link>
        ))}
      </section>
    </DashboardLayout>
  );
}

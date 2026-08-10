import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, IndianRupee, MapPin, Stethoscope } from 'lucide-react';
import AppointmentForm from '../components/AppointmentForm';
import Button from '../components/Button';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import ProfileAvatar from '../components/ProfileAvatar';
import SectionCard from '../components/SectionCard';
import VillageScheduleCard from '../components/VillageScheduleCard';
import DashboardLayout from '../layouts/DashboardLayout';
import { createAppointment } from '../api/appointments';
import { fetchAvailability } from '../api/availability';
import { fetchDoctors } from '../api/doctors';
import { useAuth } from '../state/AuthContext';
import { firstOpenSlot, formatCurrency, getDoctorName, getSpecializationName, normalizeDoctor, sortSlots } from '../utils/formatters';

export default function DoctorDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [doctorData, slotData] = await Promise.all([fetchDoctors(), fetchAvailability({ doctorId: id })]);
        const found = (doctorData || []).map(normalizeDoctor).find((item) => String(item.id) === String(id));
        setDoctor(found || null);
        setSlots(sortSlots(slotData || []));
      } catch (err) {
        setError(err.response?.data?.message || 'We could not load this doctor profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const openSlots = useMemo(() => slots.filter((slot) => !slot.isBooked), [slots]);
  const nextSlot = firstOpenSlot(openSlots);

  const handleBook = async (payload) => {
    const created = await createAppointment(payload);
    return created;
  };

  return (
    <DashboardLayout role={user?.role || 'patient'} title="Doctor Profile" subtitle="Doctor details and village visit schedule">
      {loading ? (
        <p className="text-sm text-slate-600">Loading doctor profile...</p>
      ) : error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>
      ) : !doctor ? (
        <EmptyState
          icon={Stethoscope}
          title="Doctor not found"
          text="The doctor profile may no longer be available."
          action={
            <Button variant="secondary" onClick={() => navigate('/doctors')}>
              Back to doctors
            </Button>
          }
        />
      ) : (
        <>
          <PageHeader
            eyebrow="Doctor details"
            title={getDoctorName(doctor)}
            text="Review specialization, professional details, and published village visits before booking."
          />

          <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
            <Card className="p-5">
              <div className="flex items-start gap-4">
                <ProfileAvatar name={getDoctorName(doctor)} role="doctor" size="lg" />
                <div>
                  <h2 className="font-display text-2xl font-semibold text-slate-950">{getDoctorName(doctor)}</h2>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                    <Stethoscope size={16} className="text-brand-700" aria-hidden="true" />
                    {getSpecializationName(doctor)}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-slate-700">
                <p>{doctor.qualification || 'Qualification not provided'}</p>
                <p>{doctor.experienceYears || 0} years of experience</p>
                <p className="flex items-center gap-2">
                  <IndianRupee size={16} className="text-slate-500" aria-hidden="true" />
                  {formatCurrency(doctor.consultationFee || 0)}
                </p>
              </div>
              {nextSlot && (
                <div className="mt-5 rounded-lg border border-field-100 bg-field-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-field-700">
                    <MapPin size={16} aria-hidden="true" />
                    Next village visit is available
                  </p>
                </div>
              )}
            </Card>

            <SectionCard title="Upcoming Village Visits">
              {slots.length > 0 ? (
                <div className="space-y-3">
                  {slots.slice(0, 5).map((slot) => (
                    <VillageScheduleCard key={slot.id} slot={slot} onBook={() => navigate('/appointments')} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarDays}
                  title="No upcoming village visits"
                  text="This doctor has not published a village visit schedule yet."
                />
              )}
            </SectionCard>
          </section>

          {user?.role === 'patient' && (
            <SectionCard title="Book Appointment">
              <AppointmentForm onBook={handleBook} defaultDoctorId={id} defaultDate={nextSlot?.availableDate || ''} />
            </SectionCard>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

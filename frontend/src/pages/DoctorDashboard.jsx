import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ClipboardList, FileText, MapPinned, Pill, Plus, Users } from 'lucide-react';
import AiClinicalNoteAssistant from '../components/AiClinicalNoteAssistant';
import AiFollowUpAssistant from '../components/AiFollowUpAssistant';
import AiPrescriptionOcrAssistant from '../components/AiPrescriptionOcrAssistant';
import AppointmentCard from '../components/AppointmentCard';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import RecordCard from '../components/RecordCard';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import VillageScheduleCard from '../components/VillageScheduleCard';
import DashboardLayout from '../layouts/DashboardLayout';
import { fetchAppointments, updateAppointment } from '../api/appointments';
import { fetchAvailability } from '../api/availability';
import { createPrescription } from '../api/prescriptions';
import { createRecord, fetchRecords } from '../api/records';
import { useAuth } from '../state/AuthContext';
import { getLocalDateISO, sortAppointments, sortSlots } from '../utils/formatters';

const today = getLocalDateISO();

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [activeVisit, setActiveVisit] = useState(null);
  const [visitForm, setVisitForm] = useState({
    diagnosis: '',
    treatment: '',
    notes: '',
    visitDate: today,
    medicines: '',
    dosageInstructions: ''
  });
  const [loading, setLoading] = useState(true);
  const [savingVisit, setSavingVisit] = useState(false);
  const [error, setError] = useState('');
  const doctorId = user?.doctorId;

  useEffect(() => {
    const load = async () => {
      if (!doctorId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const [apptData, recordData, availabilityData] = await Promise.all([
          fetchAppointments({ doctorId }),
          fetchRecords({ doctorId }),
          fetchAvailability({ doctorId })
        ]);
        setAppointments(sortAppointments(apptData || []));
        setRecords(recordData || []);
        setAvailability(sortSlots(availabilityData || []));
      } catch (err) {
        setError(err.response?.data?.message || 'We could not load your doctor workspace.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [doctorId]);

  const bookedAppointments = appointments.filter((item) => item.status === 'booked');
  const todayAppointments = bookedAppointments.filter((item) => item.appointmentDate === today);
  const upcomingVisits = availability.filter((slot) => slot.availableDate >= today);
  const todayVisits = upcomingVisits.filter((slot) => slot.availableDate === today);

  const stats = [
    { label: "Today's Appointments", value: todayAppointments.length, icon: CalendarCheck },
    { label: 'Upcoming Village Visits', value: upcomingVisits.length, icon: MapPinned },
    { label: 'Patients Seen', value: records.length, icon: Users },
    { label: 'Pending Appointments', value: bookedAppointments.length, icon: ClipboardList }
  ];

  const startVisit = (appointment) => {
    setActiveVisit(appointment);
    setVisitForm({
      diagnosis: '',
      treatment: '',
      notes: '',
      visitDate: appointment.appointmentDate || today,
      medicines: '',
      dosageInstructions: ''
    });
  };

  const hasVisitFormContent = ['diagnosis', 'treatment', 'notes', 'medicines', 'dosageInstructions']
    .some((field) => Boolean(visitForm[field]?.trim()));

  const applyClinicalNoteDraft = (draft) => {
    setVisitForm((current) => ({
      ...current,
      diagnosis: draft.diagnosis || '',
      treatment: draft.treatment || '',
      notes: draft.notes || '',
      medicines: draft.medicines || '',
      dosageInstructions: draft.dosageInstructions || ''
    }));
  };

  const hasPrescriptionFormContent = ['medicines', 'dosageInstructions']
    .some((field) => Boolean(visitForm[field]?.trim()));

  const applyPrescriptionOcrDraft = (draft) => {
    setVisitForm((current) => ({
      ...current,
      medicines: draft.medicines || '',
      dosageInstructions: draft.dosageInstructions || ''
    }));
  };

  const handleVisitSubmit = async (event) => {
    event.preventDefault();
    if (!activeVisit) return;
    if ((visitForm.medicines && !visitForm.dosageInstructions) || (!visitForm.medicines && visitForm.dosageInstructions)) {
      setError('Enter both medicines and dosage instructions to create a prescription.');
      return;
    }
    setSavingVisit(true);
    setError('');
    try {
      const record = await createRecord({
        patientId: activeVisit.patientId,
        doctorId,
        diagnosis: visitForm.diagnosis,
        treatment: visitForm.treatment,
        notes: visitForm.notes,
        visitDate: visitForm.visitDate
      });
      let recordForState = record;
      if (visitForm.medicines && visitForm.dosageInstructions) {
        const prescription = await createPrescription({
          medicalRecordId: record.id,
          patientId: activeVisit.patientId,
          doctorId,
          medicines: visitForm.medicines,
          dosageInstructions: visitForm.dosageInstructions
        });
        recordForState = { ...record, Prescriptions: [...(record.Prescriptions || []), prescription] };
      }
      const updated = await updateAppointment(activeVisit.id, { status: 'completed' });
      setAppointments((list) => list.map((item) => (item.id === updated.id ? updated : item)));
      setRecords((list) => [recordForState, ...list]);
      setActiveVisit(null);
    } catch (err) {
      setError(err.response?.data?.message || 'We could not complete this visit.');
    } finally {
      setSavingVisit(false);
    }
  };

  return (
    <DashboardLayout role="doctor" title="Doctor Dashboard" subtitle="Manage village visits, appointments, and care records">
      <PageHeader
        eyebrow="Doctor workspace"
        title={`Good ${new Date().getHours() < 12 ? 'morning' : 'day'}, Dr. ${user?.name?.replace(/^Dr\\.?\\s*/i, '').split(' ')[0] || 'Doctor'}`}
        text="Publish village visits, see appointment queues, and complete consultations with records and prescriptions."
        action={
          <Button as={Link} to="/doctor/schedule" icon={Plus}>
            Add Village Visit
          </Button>
        }
      />

      {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Today's Schedule">
          {loading ? (
            <p className="text-sm text-slate-600">Loading today's work...</p>
          ) : todayVisits.length > 0 ? (
            <div className="space-y-3">
              {todayVisits.map((slot) => (
                <VillageScheduleCard key={slot.id} slot={slot} showDoctor={false} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={MapPinned}
              title="No village visit planned for today"
              text="Publish a visit when you know which village you will serve next."
              action={
                <Button as={Link} to="/doctor/schedule" variant="secondary">
                  Plan a Village Visit
                </Button>
              }
            />
          )}
        </SectionCard>

        <SectionCard title="Recent Appointments">
          {loading ? (
            <p className="text-sm text-slate-600">Loading appointments...</p>
          ) : bookedAppointments.length > 0 ? (
            <div className="space-y-3">
              {bookedAppointments.slice(0, 3).map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  role="doctor"
                  onComplete={startVisit}
                  updating={savingVisit && activeVisit?.id === appointment.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarCheck} title="No pending appointments" text="Booked patient visits will appear here." />
          )}
        </SectionCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Quick Actions">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { to: '/doctor/schedule', icon: MapPinned, title: 'Add Village Visit', text: 'Publish state, district, taluka, village, date, and time.' },
              { to: '/appointments', icon: CalendarCheck, title: 'View Appointments', text: 'Today, upcoming, completed, and cancelled.' },
              { to: '/records', icon: FileText, title: 'Patient Records', text: 'Review and manage consultation notes.' },
              { to: '/prescriptions', icon: Pill, title: 'Prescriptions', text: 'View digital prescription documents.' }
            ].map((item) => (
              <Link key={item.to} to={item.to} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-200">
                <item.icon size={21} className="text-brand-700" aria-hidden="true" />
                <p className="mt-3 font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-600">{item.text}</p>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent Medical Notes">
          {loading ? (
            <p className="text-sm text-slate-600">Loading records...</p>
          ) : records.length > 0 ? (
            <div className="space-y-3">
              {records.slice(0, 3).map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}
            </div>
          ) : (
            <EmptyState icon={FileText} title="No medical records yet" text="Records appear after you complete a patient visit." />
          )}
        </SectionCard>
      </section>

      {activeVisit && (
        <SectionCard title="Complete Visit">
          <div className="space-y-5">
            <AiClinicalNoteAssistant
              key={activeVisit.id}
              onApply={applyClinicalNoteDraft}
              hasExistingValues={hasVisitFormContent}
              disabled={savingVisit}
            />
            <AiPrescriptionOcrAssistant
              key={`ocr-${activeVisit.id}`}
              onApply={applyPrescriptionOcrDraft}
              hasExistingValues={hasPrescriptionFormContent}
              disabled={savingVisit}
            />
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleVisitSubmit}>
              <label className="block text-sm font-medium text-slate-700">
                Visit date
                <input
                  type="date"
                  value={visitForm.visitDate}
                  onChange={(event) => setVisitForm((current) => ({ ...current, visitDate: event.target.value }))}
                  className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Diagnosis
                <input
                  value={visitForm.diagnosis}
                  onChange={(event) => setVisitForm((current) => ({ ...current, diagnosis: event.target.value }))}
                  className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Treatment
                <input
                  value={visitForm.treatment}
                  onChange={(event) => setVisitForm((current) => ({ ...current, treatment: event.target.value }))}
                  className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Medicines
                <input
                  value={visitForm.medicines}
                  onChange={(event) => setVisitForm((current) => ({ ...current, medicines: event.target.value }))}
                  className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Dosage instructions
                <input
                  value={visitForm.dosageInstructions}
                  onChange={(event) => setVisitForm((current) => ({ ...current, dosageInstructions: event.target.value }))}
                  className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700 md:col-span-2">
                Notes
                <textarea
                  value={visitForm.notes}
                  onChange={(event) => setVisitForm((current) => ({ ...current, notes: event.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>
              <AiFollowUpAssistant
                patientId={activeVisit.patientId}
                visitDate={visitForm.visitDate}
                visitForm={visitForm}
                disabled={savingVisit}
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end md:col-span-2">
                <Button variant="secondary" onClick={() => setActiveVisit(null)} disabled={savingVisit}>
                  Close
                </Button>
                <Button type="submit" disabled={savingVisit}>
                  {savingVisit ? 'Saving...' : 'Complete Visit'}
                </Button>
              </div>
            </form>
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}

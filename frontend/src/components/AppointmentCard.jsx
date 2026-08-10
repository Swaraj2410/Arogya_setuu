import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, CheckCircle2, Clock, FileText, MapPin, Trash2, UserRound, XCircle } from 'lucide-react';
import Badge from './Badge';
import Button from './Button';
import Card from './Card';
import ProfileAvatar from './ProfileAvatar';
import { formatDate, formatTime, getDoctorName, getPatientName, getSpecializationName } from '../utils/formatters';

export default function AppointmentCard({
  appointment,
  onCancel,
  onComplete,
  onDelete,
  onReschedule,
  deleting = false,
  updating = false,
  role = 'patient'
}) {
  const doctor = appointment.Doctor || appointment.doctor;
  const patient = appointment.Patient || appointment.patient;
  const primaryName = role === 'doctor' ? getPatientName(patient) : getDoctorName(doctor);
  const secondary = role === 'doctor' ? patient?.village || appointment.reason || 'Patient visit' : getSpecializationName(doctor);

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <ProfileAvatar name={primaryName} role={role === 'doctor' ? 'patient' : 'doctor'} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-950">{primaryName}</h3>
              <Badge label={appointment.status} variant={appointment.status} />
            </div>
            <p className="mt-1 text-sm text-slate-600">{secondary}</p>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-slate-700 sm:text-right">
          <span className="inline-flex items-center gap-2 sm:justify-end">
            <Clock size={16} className="text-brand-700" aria-hidden="true" />
            {formatDate(appointment.appointmentDate)} at {formatTime(appointment.appointmentTime)}
          </span>
          <span className="inline-flex items-center gap-2 sm:justify-end">
            <MapPin size={16} className="text-field-700" aria-hidden="true" />
            {patient?.village || 'Village from patient profile'}
          </span>
        </div>
      </div>

      {appointment.reason && (
        <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
          <span className="font-semibold text-slate-900">Reason: </span>
          {appointment.reason}
        </div>
      )}

      {(onReschedule || onCancel || onComplete || onDelete) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {onReschedule && appointment.status === 'booked' && (
            <Button variant="secondary" size="sm" icon={CalendarPlus} onClick={() => onReschedule(appointment)} disabled={updating}>
              Reschedule
            </Button>
          )}
          {onCancel && appointment.status === 'booked' && (
            <Button variant="secondary" size="sm" icon={XCircle} onClick={() => onCancel(appointment)} disabled={updating}>
              Cancel
            </Button>
          )}
          {onComplete && appointment.status === 'booked' && (
            <Button variant="subtle" size="sm" icon={CheckCircle2} onClick={() => onComplete(appointment)} disabled={updating}>
              Complete Visit
            </Button>
          )}
          {role === 'doctor' && (
            <Button as={Link} to="/records" variant="secondary" size="sm" icon={FileText}>
              Patient Records
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" size="sm" icon={Trash2} onClick={() => onDelete(appointment)} disabled={deleting}>
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

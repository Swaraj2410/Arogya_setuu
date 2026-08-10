import React from 'react';
import { CalendarClock, MapPin, Stethoscope } from 'lucide-react';
import Badge from './Badge';
import Button from './Button';
import Card from './Card';
import ProfileAvatar from './ProfileAvatar';
import { formatDate, formatLocation, formatTimeRange, getDoctorName, getRelativeDayLabel, getSpecializationName } from '../utils/formatters';

export default function VillageScheduleCard({ slot, onBook, onDelete, deleting = false, showDoctor = true }) {
  const doctor = slot.Doctor || slot.doctor;
  const doctorName = getDoctorName(doctor);
  const relative = getRelativeDayLabel(slot.availableDate);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          {showDoctor && <ProfileAvatar name={doctorName} role="doctor" />}
          <div className="min-w-0">
            {showDoctor && <h3 className="font-semibold text-slate-950">{doctorName}</h3>}
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
              <Stethoscope size={15} className="text-brand-700" aria-hidden="true" />
              {getSpecializationName(doctor)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {relative && <Badge label={relative} variant="warm" />}
          <Badge label={slot.isBooked ? 'Fully Booked' : 'Available'} variant={slot.isBooked ? 'pending' : 'booked'} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <p className="flex items-center gap-2">
          <MapPin size={16} className="text-field-700" aria-hidden="true" />
          {formatLocation(slot)}
        </p>
        <p className="flex items-center gap-2">
          <CalendarClock size={16} className="text-brand-700" aria-hidden="true" />
          {formatDate(slot.availableDate)}, {formatTimeRange(slot)}
        </p>
      </div>

      {(onBook || onDelete) && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {onDelete && (
            <Button variant="danger" onClick={() => onDelete(slot)} disabled={slot.isBooked || deleting}>
              Delete Visit
            </Button>
          )}
          {onBook && (
            <Button onClick={() => onBook(slot)} disabled={slot.isBooked}>
              Book Appointment
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

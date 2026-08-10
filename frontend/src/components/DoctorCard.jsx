import React from 'react';
import { CalendarDays, IndianRupee, MapPin, Stethoscope } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import ProfileAvatar from './ProfileAvatar';
import { formatCurrency, formatDate, formatShortLocation, formatTimeRange, getDoctorName, getSpecializationName } from '../utils/formatters';

export default function DoctorCard({ doctor, nextSlot, onSchedule, onBook, actionLabel = 'Book Appointment' }) {
  const name = getDoctorName(doctor);
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <ProfileAvatar name={name} role="doctor" size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-950">{name}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
            <Stethoscope size={15} className="text-brand-700" aria-hidden="true" />
            {getSpecializationName(doctor)}
          </p>
          <div className="mt-3 grid gap-2 text-sm text-slate-600">
            <span>{doctor.experienceYears || 0} years experience</span>
            <span className="inline-flex items-center gap-1">
              <IndianRupee size={15} className="text-slate-500" aria-hidden="true" />
              {formatCurrency(doctor.consultationFee || 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-field-100 bg-field-50 p-3">
        {nextSlot ? (
          <>
            <p className="flex items-center gap-2 text-sm font-semibold text-field-700">
              <CalendarDays size={16} aria-hidden="true" />
              Next village visit
            </p>
            <p className="mt-2 text-sm text-slate-700">{formatDate(nextSlot.availableDate)}</p>
            <p className="text-sm text-slate-700">{formatTimeRange(nextSlot)}</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
              <MapPin size={15} aria-hidden="true" />
              {formatShortLocation(nextSlot)}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-600">No upcoming village visit has been published yet.</p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" className="flex-1" onClick={onSchedule}>
          View Schedule
        </Button>
        <Button className="flex-1" onClick={onBook} disabled={!nextSlot}>
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
}

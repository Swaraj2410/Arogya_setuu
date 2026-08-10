export const LOCATION_FIELDS = ['state', 'district', 'taluka', 'village'];

export const trimText = (value) => (value === undefined || value === null ? '' : String(value).trim());

export const hasCompleteLocation = (source = {}) => LOCATION_FIELDS.every((field) => trimText(source[field]));

export const locationParams = (source = {}) =>
  LOCATION_FIELDS.reduce((params, field) => ({ ...params, [field]: trimText(source[field]) }), {});

export const formatLocation = (source = {}, fallback = 'Location not provided') => {
  const parts = ['village', 'taluka', 'district', 'state'].map((field) => trimText(source[field])).filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : fallback;
};

export const formatShortLocation = (source = {}, fallback = 'Location not provided') => {
  const parts = ['village', 'taluka'].map((field) => trimText(source[field])).filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : fallback;
};

export const getLocalDateISO = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const timeToMinutes = (value) => {
  if (!value) return null;
  const [hour, minute] = String(value).split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
};

export const formatTime = (value) => {
  const minutes = timeToMinutes(value);
  if (minutes === null) return value || '';

  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export const formatTimeRange = (source = {}) => `${formatTime(source.startTime)} - ${formatTime(source.endTime)}`;

export const formatDate = (value) => {
  if (!value) return '';
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString([], {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export const formatShortDate = (value) => {
  if (!value) return '';
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString([], {
    day: 'numeric',
    month: 'short'
  });
};

export const getRelativeDayLabel = (value) => {
  if (!value) return '';
  const today = getLocalDateISO();
  const tomorrow = getLocalDateISO(new Date(Date.now() + 24 * 60 * 60 * 1000));
  if (value === today) return 'Today';
  if (value === tomorrow) return 'Tomorrow';

  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return '';
  const target = new Date(year, month - 1, day).getTime();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((target - start) / (24 * 60 * 60 * 1000));
  return diffDays > 1 && diffDays <= 7 ? 'This Week' : '';
};

export const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const normalizeDoctor = (doctor = {}) => ({
  ...doctor,
  id: doctor.id,
  name: doctor.User?.name || doctor.user?.name || doctor.name,
  specializationId: doctor.specializationId || doctor.specialization_id || doctor.Specialization?.id,
  specializationName: doctor.Specialization?.name || doctor.specialization?.name || doctor.specializationName || 'General Medicine',
  experienceYears: doctor.experienceYears || doctor.experience_years || 0,
  consultationFee: doctor.consultationFee || doctor.consultation_fee || 0
});

export const getDoctorName = (doctor = {}) =>
  doctor?.User?.name || doctor?.user?.name || doctor?.name || (doctor?.id ? `Doctor #${doctor.id}` : 'Doctor');

export const getPatientName = (patient = {}) =>
  patient?.User?.name || patient?.user?.name || patient?.name || (patient?.id ? `Patient #${patient.id}` : 'Patient');

export const getSpecializationName = (doctor = {}) =>
  doctor?.Specialization?.name || doctor?.specialization?.name || doctor?.specializationName || 'General Medicine';

export const sortSlots = (items = []) =>
  [...items].sort((a, b) => `${a.availableDate || ''} ${a.startTime || ''}`.localeCompare(`${b.availableDate || ''} ${b.startTime || ''}`));

export const sortAppointments = (items = []) =>
  [...items].sort((a, b) =>
    `${a.appointmentDate || ''} ${a.appointmentTime || ''}`.localeCompare(`${b.appointmentDate || ''} ${b.appointmentTime || ''}`)
  );

export const firstOpenSlot = (slots = []) => sortSlots(slots).find((slot) => !slot.isBooked);

export const getAppointmentLocation = (appointment = {}) => {
  const doctor = appointment.Doctor || appointment.doctor || {};
  return formatLocation(appointment, formatShortLocation(doctor, 'Village details unavailable'));
};

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

import { Op, col, fn, where as sequelizeWhere } from 'sequelize';
import { Appointment, Doctor, DoctorAvailability, User } from '../models/index.js';

const getDoctorProfile = (userId) => Doctor.findOne({ where: { userId } });
const today = () => new Date().toISOString().slice(0, 10);
const LOCATION_FIELDS = ['state', 'district', 'taluka', 'village'];

const availabilityIncludes = [{ model: Doctor, include: [{ model: User, attributes: ['name', 'email'] }] }];

const trimNullable = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
};

const extractLocation = (source) =>
  LOCATION_FIELDS.reduce((location, field) => ({ ...location, [field]: trimNullable(source[field]) }), {});

const locationWhereClauses = (source) =>
  LOCATION_FIELDS.map((field) => {
    const value = trimNullable(source[field]);
    if (!value) return null;
    return sequelizeWhere(fn('LOWER', fn('TRIM', col(field))), value.toLowerCase());
  }).filter(Boolean);

const resolveDoctorId = async (req, requestedDoctorId) => {
  if (req.user.role === 'doctor') {
    const doctor = await getDoctorProfile(req.user.id);
    if (!doctor) return { error: { status: 400, message: 'Doctor profile not found' } };
    if (requestedDoctorId && Number(requestedDoctorId) !== doctor.id) {
      return { error: { status: 403, message: 'Cannot manage availability for another doctor' } };
    }
    return { doctorId: doctor.id };
  }
  return { doctorId: requestedDoctorId ? Number(requestedDoctorId) : null };
};

export const listAvailability = async (req, res) => {
  const { doctorId: requestedDoctorId, date } = req.query;
  const where = {};

  const resolved = await resolveDoctorId(req, requestedDoctorId);
  if (resolved.error) return res.status(resolved.error.status).json({ message: resolved.error.message });
  if (resolved.doctorId) where.doctorId = resolved.doctorId;
  if (date) where.availableDate = date;
  else where.availableDate = { [Op.gte]: today() };
  const locationFilters = locationWhereClauses(req.query);
  if (locationFilters.length > 0) where[Op.and] = locationFilters;

  const slots = await DoctorAvailability.findAll({
    where,
    include: availabilityIncludes,
    order: [
      ['availableDate', 'ASC'],
      ['startTime', 'ASC']
    ]
  });

  if (slots.length === 0) return res.json([]);

  const booked = await Appointment.findAll({
    where: {
      doctorId: slots.map((slot) => slot.doctorId),
      appointmentDate: slots.map((slot) => slot.availableDate),
      status: 'booked'
    },
    attributes: ['doctorId', 'appointmentDate', 'appointmentTime']
  });
  const bookedKeys = new Set(booked.map((appt) => `${appt.doctorId}|${appt.appointmentDate}|${appt.appointmentTime}`));

  res.json(
    slots.map((slot) => {
      const data = slot.toJSON();
      return {
        ...data,
        isBooked: bookedKeys.has(`${slot.doctorId}|${slot.availableDate}|${slot.startTime}`)
      };
    })
  );
};

export const createAvailability = async (req, res) => {
  const { doctorId: requestedDoctorId, availableDate, startTime, endTime } = req.body;
  if (req.user.role === 'patient') return res.status(403).json({ message: 'Patients cannot create availability slots' });

  const resolved = await resolveDoctorId(req, requestedDoctorId);
  if (resolved.error) return res.status(resolved.error.status).json({ message: resolved.error.message });

  const location = extractLocation(req.body);
  if (LOCATION_FIELDS.some((field) => !location[field])) {
    return res.status(400).json({ message: 'State, district, taluka, and village are required' });
  }

  if (!resolved.doctorId || !availableDate || !startTime || !endTime) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  if (availableDate < today()) return res.status(400).json({ message: 'Availability date cannot be in the past' });
  if (endTime <= startTime) return res.status(400).json({ message: 'End time must be after start time' });

  const doctor = await Doctor.findByPk(resolved.doctorId);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

  const [slot, created] = await DoctorAvailability.findOrCreate({
    where: { doctorId: resolved.doctorId, availableDate, startTime },
    defaults: { doctorId: resolved.doctorId, availableDate, startTime, endTime, ...location }
  });
  if (!created) return res.status(409).json({ message: 'Availability slot already exists' });

  const slotWithDetails = await DoctorAvailability.findByPk(slot.id, { include: availabilityIncludes });
  res.status(201).json({ ...slotWithDetails.toJSON(), isBooked: false });
};

export const deleteAvailability = async (req, res) => {
  const { id } = req.params;
  const slot = await DoctorAvailability.findByPk(id);
  if (!slot) return res.status(404).json({ message: 'Not found' });

  if (req.user.role === 'doctor') {
    const doctor = await getDoctorProfile(req.user.id);
    if (!doctor || slot.doctorId !== doctor.id) return res.status(404).json({ message: 'Not found' });
  } else if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only doctors can delete availability slots' });
  }

  const booked = await Appointment.findOne({
    where: {
      doctorId: slot.doctorId,
      appointmentDate: slot.availableDate,
      appointmentTime: slot.startTime,
      status: 'booked'
    }
  });
  if (booked) return res.status(409).json({ message: 'Cannot delete a slot with a booked appointment' });

  await slot.destroy();
  res.status(204).send();
};

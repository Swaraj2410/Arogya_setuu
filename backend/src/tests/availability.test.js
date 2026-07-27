import request from 'supertest';
import app from '../app.js';
import { seed } from '../seeders/seed.js';
import { sequelize } from '../models/index.js';

let patientToken;
let doctorToken;

const futureDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const villageLocation = {
  state: 'Maharashtra',
  district: 'Gondia',
  taluka: 'Tirora',
  village: 'Mundikota'
};

beforeAll(async () => {
  await seed();
  const [patient, doctor] = await Promise.all([
    request(app).post('/api/auth/login').send({ email: 'ananya.sharma@example.com', password: 'password' }),
    request(app).post('/api/auth/login').send({ email: 'asha.iyer@example.com', password: 'password' })
  ]);
  patientToken = patient.body.token;
  doctorToken = doctor.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Availability', () => {
  it('lets a doctor create availability with village location', async () => {
    const res = await request(app)
      .post('/api/availability')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        doctorId: 1,
        availableDate: futureDate,
        startTime: '09:15',
        endTime: '09:45',
        state: ' Maharashtra ',
        district: ' Gondia ',
        taluka: ' Tirora ',
        village: ' Mundikota '
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      doctorId: 1,
      state: 'Maharashtra',
      district: 'Gondia',
      taluka: 'Tirora',
      village: 'Mundikota',
      isBooked: false
    });
    expect(res.body.Doctor.User.name).toBe('Dr. Asha Iyer');
  });

  it('rejects availability creation when location is missing', async () => {
    const res = await request(app)
      .post('/api/availability')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        doctorId: 1,
        availableDate: futureDate,
        startTime: '10:15',
        endTime: '10:45',
        state: 'Maharashtra',
        district: 'Gondia',
        taluka: 'Tirora'
      });

    expect(res.status).toBe(400);
  });

  it('lets a patient list schedules matching their village', async () => {
    const res = await request(app)
      .get('/api/availability')
      .query({
        state: ' maharashtra ',
        district: 'GONDIA',
        taluka: 'tirora',
        village: 'mundikota'
      })
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((slot) => slot.village === 'Mundikota')).toBe(true);
    expect(res.body.every((slot) => slot.Doctor?.User?.name)).toBe(true);
  });

  it('does not return schedules from another village when village filtering is used', async () => {
    const res = await request(app)
      .get('/api/availability')
      .query({ village: 'Mundikota' })
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.some((slot) => slot.village === 'Sawangi')).toBe(false);
  });

  it('prevents patients from creating doctor availability', async () => {
    const res = await request(app)
      .post('/api/availability')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: 1,
        availableDate: futureDate,
        startTime: '11:15',
        endTime: '11:45',
        ...villageLocation
      });

    expect(res.status).toBe(403);
  });

  it('prevents doctors from managing another doctor schedule', async () => {
    const res = await request(app)
      .post('/api/availability')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        doctorId: 2,
        availableDate: futureDate,
        startTime: '12:15',
        endTime: '12:45',
        ...villageLocation
      });

    expect(res.status).toBe(403);
  });
});

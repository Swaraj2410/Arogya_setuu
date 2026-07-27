import request from 'supertest';
import app from '../app.js';
import { seed } from '../seeders/seed.js';
import { sequelize } from '../models/index.js';

beforeAll(async () => {
  await seed();
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth', () => {
  it('logs in seeded user', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'ananya.sharma@example.com', password: 'password' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.patientProfile).toMatchObject({
      state: 'Maharashtra',
      district: 'Gondia',
      taluka: 'Tirora',
      village: 'Mundikota'
    });
  });

  it('rejects bad credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'bad@example.com', password: 'nope' });
    expect(res.status).toBe(401);
  });

  it('registers a patient with rural location fields', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Meena Patil',
      email: 'meena.patil@example.com',
      password: 'password',
      role: 'patient',
      age: 28,
      gender: 'Female',
      phone: '+91 90000 11111',
      address: 'Near primary school',
      bloodGroup: 'B+',
      state: ' Maharashtra ',
      district: ' Gondia ',
      taluka: ' Tirora ',
      village: ' Mundikota '
    });

    expect(res.status).toBe(201);
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.patientId).toBeDefined();
    expect(res.body.user.patientProfile).toMatchObject({
      age: 28,
      state: 'Maharashtra',
      district: 'Gondia',
      taluka: 'Tirora',
      village: 'Mundikota'
    });
  });

  it('rejects patient registration when a rural location field is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Missing Village',
      email: 'missing.village@example.com',
      password: 'password',
      role: 'patient',
      state: 'Maharashtra',
      district: 'Gondia',
      taluka: 'Tirora'
    });

    expect(res.status).toBe(400);
  });
});

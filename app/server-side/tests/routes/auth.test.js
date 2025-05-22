const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const AUTH_ACCOUNT = require('../../src/models/authAccount');
const ACCOUNT = require('../../src/models/account');
const { encryptPassword, decryptPassword } = require('../../src/helpers/passwordHandlers');
const sendEmail = require('../../src/helpers/sendcode');
jest.mock('../../src/helpers/jwtHandlers');

jest.mock('../../src/models/authAccount');
jest.mock('../../src/models/account');
jest.mock('jsonwebtoken');
jest.mock('../../src/helpers/sendcode');
const { checkUserAccess } = require('../../src/helpers/jwtHandlers');
jest.mock('../../src/helpers/passwordHandlers', () => ({
    decryptPassword: jest.fn(),
    encryptPassword: jest.fn(),
}));

const accountRoutes = require('../../src/routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/auth', accountRoutes);

afterEach(() => jest.clearAllMocks());

describe('POST /auth/jwt/long', () => {
  it('successfully returns jwt', async () => {
    AUTH_ACCOUNT.findOne.mockResolvedValue({
      accountId: '123',
      emailData: { password: 'enc' }
    });
    ACCOUNT.findById.mockResolvedValue({ jwts: [], save: jest.fn() });
    decryptPassword.mockReturnValue('pass');
    jwt.sign.mockReturnValue('jwt');

    const res = await request(app).post('/auth/jwt/long').send({
      accountType: 'email',
      email: 'a@a.a',
      password: 'pass'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.jwt).toBe('jwt');
  });

  it('returns 404 - account not found', async () => {
    AUTH_ACCOUNT.findOne.mockResolvedValue(null);
    const res = await request(app).post('/auth/jwt/long').send({
      accountType: 'email',
      email: 'not@found.com',
      password: 'x'
    });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Аккаунт не найден');
  });
});

describe('POST /auth/jwt/temporary', () => {
  it('successfully creates temporary jwt', async () => {
    AUTH_ACCOUNT.findOne.mockResolvedValue({ accountId: '456' });
    ACCOUNT.findById.mockResolvedValue({ jwts: [], save: jest.fn() });
    jwt.sign.mockReturnValue('temp.jwt');

    const res = await request(app).post('/auth/jwt/temporary').query({ email: 'a@a.a' });

    expect(res.statusCode).toBe(201);
    expect(res.body.jwt).toBe('temp.jwt');
  });

  it('returns 404 - account not found', async () => {
    AUTH_ACCOUNT.findOne.mockResolvedValue(null);
    const res = await request(app).post('/auth/jwt/temporary').query({ email: 'not@found.com' });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Аккаунт не найден');
  });
});

describe('PUT /auth/account', () => {
  it('successfully updates password', async () => {
    checkUserAccess.mockResolvedValue('789');
    AUTH_ACCOUNT.findOne.mockResolvedValue({ emailData: {}, save: jest.fn() });
    encryptPassword.mockReturnValue('encrypted');

    const res = await request(app).put('/auth/account').send({
      jwt: 'jwt',
      accountType: 'email',
      password: 'newpass'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Аккаунт обновлен');
  });

  it('returns 404 - invalid jwt', async () => {
    checkUserAccess.mockResolvedValue(null);
    const res = await request(app).put('/auth/account').send({
      jwt: 'invalid',
      accountType: 'email',
      password: 'x'
    });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Аккаунт не найден');
  });
});

describe('GET /auth/account/code', () => {
  it('successfully sends code', async () => {
    AUTH_ACCOUNT.findOne.mockResolvedValue({ _id: 'x' });
    sendEmail.mockReturnValue({ resetCode: '123456' });

    const res = await request(app).get('/auth/account/code').query({ email: 'a@a.a' });

    expect(res.statusCode).toBe(201);
    expect(res.body.resetCode).toBe('123456');
  });

  it('returns 404 - account not found', async () => {
    AUTH_ACCOUNT.findOne.mockResolvedValue(null);

    const res = await request(app).get('/auth/account/code').query({ email: 'not@found.com' });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Аккаунт не найден');
  });
});

const request = require('supertest');
const express = require('express');

jest.mock('../../src/models/account');
jest.mock('../../src/models/authAccount');
jest.mock('../../src/models/project');
jest.mock('../../src/models/furnitureCard');
jest.mock('../../src/models/imagesFurniture');
jest.mock('../../src/helpers/jwtHandlers');
jest.mock('../../src/helpers/passwordHandlers');

const ACCOUNT = require('../../src/models/account');
const AUTH_ACCOUNT = require('../../src/models/authAccount');
const PROJECT = require('../../src/models/project');
const FURNITURE_CARD = require('../../src/models/furnitureCard');
const IMAGES_FURNITURE = require('../../src/models/imagesFurniture');
const { checkUserAccess } = require('../../src/helpers/jwtHandlers');
const { encryptPassword, decryptPassword } = require('../../src/helpers/passwordHandlers');

const accountRoutes = require('../../src/routes/accountRoutes');

const app = express();
app.use(express.json());
app.use('/account', accountRoutes);

describe('Account Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('DELETE /account/jwt/delete - successfully deletes JWT', async () => {
        checkUserAccess.mockResolvedValue('userId1');
        const mockAccount = {
            nickname: 'User1',
            jwts: ['token1', 'token2'],
            save: jest.fn().mockResolvedValue(),
        };
        ACCOUNT.findById.mockResolvedValue(mockAccount);

        const res = await request(app).delete('/account/jwt/delete').query({ jwt: 'token1' });

        expect(checkUserAccess).toHaveBeenCalledWith('token1');
        expect(ACCOUNT.findById).toHaveBeenCalledWith('userId1');
        expect(mockAccount.jwts).toEqual(['token2']);
        expect(mockAccount.save).toHaveBeenCalled();
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('JWT deleted');
    });
    
    it('DELETE /account/jwt/delete - returns 404 if account not found', async () => {
        checkUserAccess.mockResolvedValue(null);

        const res = await request(app).delete('/account/jwt/delete').query({ jwt: 'invalidToken' });

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Аккаунт не найден');
    });

    it('POST /account - creates an account with email type', async () => {
        checkUserAccess.mockResolvedValue('userId1');
        AUTH_ACCOUNT.findOne.mockResolvedValue(null);

        ACCOUNT.prototype.save = jest.fn().mockResolvedValue();
        AUTH_ACCOUNT.prototype.save = jest.fn().mockResolvedValue();

        encryptPassword.mockImplementation(p => `encrypted-${p}`);

        const res = await request(app)
            .post('/account')
            .send({
                nickname: 'newUser',
                email: 'new@example.com',
                password: '12345',
                accountType: 'email'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Пользователь создан');
    });

    it('POST /account - returns 409 if account already exists', async () => {
        checkUserAccess.mockResolvedValue('userId1');
        AUTH_ACCOUNT.findOne.mockResolvedValue({ _id: 'existingId' });

        const res = await request(app)
            .post('/account')
            .send({
                nickname: 'newUser',
                email: 'existing@example.com',
                password: '12345',
                accountType: 'email'
            });

        expect(res.statusCode).toBe(409);
        expect(res.body.message).toBe('Аккаунт уже существует');
    });

    it('GET /account - returns account data', async () => {
        checkUserAccess.mockResolvedValue('userId1');
        ACCOUNT.findById.mockResolvedValue({
            nickname: 'User1',
        });
        AUTH_ACCOUNT.findOne.mockResolvedValue({
            emailData: { email: 'user@example.com', password: 'encrypted-123' },
            googleData: {},
        });
        PROJECT.find.mockResolvedValue([{ _id: 'proj1', name: 'Project 1', rooms: [], authorId: 'userId1' }]);
        FURNITURE_CARD.find.mockResolvedValue([{ _id: 'furn1', name: 'Furniture 1', authorId: 'userId1' }]);
        IMAGES_FURNITURE.findOne.mockResolvedValue({ color: 'red', idMainImage: 0, furnitureCardId: 'furn1' });
        decryptPassword.mockImplementation(p => '123');

        const res = await request(app).get('/account').query({ jwt: 'validToken' });

        expect(res.statusCode).toBe(201);
        expect(res.body.accountData.email).toBe('user@example.com');
        expect(res.body.accountData.nickname).toBe('User1');
        expect(res.body.accountData.password).toBe('123');
        expect(res.body.accountData.projects.length).toBeGreaterThan(0);
        expect(res.body.accountData.furnitures.length).toBeGreaterThan(0);
    });

    it('DELETE /account - successfully deletes account', async () => {
        checkUserAccess.mockResolvedValue('userId1');

        const mockAccount = { remove: jest.fn().mockResolvedValue() };
        const mockAuthAccount = { remove: jest.fn().mockResolvedValue() };

        ACCOUNT.findById.mockResolvedValue(mockAccount);
        AUTH_ACCOUNT.findOne.mockResolvedValue(mockAuthAccount);

        const res = await request(app).delete('/account').query({ jwt: 'validToken' });

        expect(checkUserAccess).toHaveBeenCalledWith('validToken');
        expect(ACCOUNT.findById).toHaveBeenCalledWith('userId1');
        expect(AUTH_ACCOUNT.findOne).toHaveBeenCalledWith({ accountId: 'userId1' });
        expect(mockAuthAccount.remove).toHaveBeenCalled();
        expect(mockAccount.remove).toHaveBeenCalled();
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Аккаунт успешно удален');
    });

    it('DELETE /account - returns 404 if account not found', async () => {
        checkUserAccess.mockResolvedValue(null);

        const res = await request(app).delete('/account').query({ jwt: 'invalidToken' });

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Аккаунт не найден');
    });

    it('PUT /account - successfully updates nickname', async () => {
        checkUserAccess.mockResolvedValue('userId1');

        const mockAccount = {
            nickname: 'OldName',
            save: jest.fn().mockResolvedValue()
        };

        ACCOUNT.findById.mockResolvedValue(mockAccount);

        const res = await request(app)
            .put('/account')
            .query({ jwt: 'validToken', nickname: 'NewName' });

        expect(checkUserAccess).toHaveBeenCalledWith('validToken');
        expect(ACCOUNT.findById).toHaveBeenCalledWith('userId1');
        expect(mockAccount.nickname).toBe('NewName');
        expect(mockAccount.save).toHaveBeenCalled();
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Аккаунт обновлен');
    });

    it('PUT /account - returns 404 if account not found', async () => {
        checkUserAccess.mockResolvedValue('userId1');
        ACCOUNT.findById.mockResolvedValue(null);

        const res = await request(app)
            .put('/account')
            .query({ jwt: 'validToken', nickname: 'NewName' });

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Аккаунт не найден');
    });
});

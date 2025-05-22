const request = require('supertest');
const express = require('express');

jest.mock('../../src/models/furnitureCard');
jest.mock('../../src/models/imagesFurniture');
jest.mock('../../src/helpers/jwtHandlers');

const FURNITURE_CARD = require('../../src/models/furnitureCard');
const IMAGES_FURNITURE = require('../../src/models/imagesFurniture');
const { checkUserAccess } = require('../../src/helpers/jwtHandlers');

const furnitureRoutes = require('../../src/routes/furnitureCardRoutes');

const app = express();
app.use(express.json());
app.use('/furniture/card', furnitureRoutes);

describe('Furniture Card Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockUserId = '6641e6b9ce33a302f92f7c11';
    const mockFurnitureId = '6634f1129f6f7cba29cd12f9';

    const mockFurniture = {
        _id: mockFurnitureId,
        name: 'Диван',
        description: 'Угловой диван',
        colors: [{ color: '#fff', idImages: '' }],
        shops: [{ cost: 12999, url: 'https://example.com' }],
        authorId: mockUserId,
        proportions: { width: 200, length: 300, height: 90 },
        additionalData: {},
        save: jest.fn().mockResolvedValue({ message: 'Товар успешно обновлен' })
    };

    describe('POST /furniture/card', () => {
        it('should create new furniture card', async () => {
            checkUserAccess.mockResolvedValue(mockUserId);
            FURNITURE_CARD.mockImplementation(() => mockFurniture);

            const res = await request(app)
                .post('/furniture/card')
                .query({ jwt: 'validToken' })
                .send({
                    name: 'Диван',
                    description: 'Угловой диван',
                    colors: [{ color: '#fff' }],
                    shops: [{ cost: 12999, url: 'https://example.com' }],
                    proportions: { width: 200, length: 300, height: 90 }
                });

            expect(checkUserAccess).toHaveBeenCalledWith('validToken');
            expect(res.statusCode).toBe(201);
            expect(res.body.furnitureData).toMatchObject({
                name: 'Диван',
                authorId: mockUserId
            });
        });

        it('should return 404 if account not found', async () => {
            checkUserAccess.mockResolvedValue(null);

            const res = await request(app)
                .post('/furniture/card')
                .query({ jwt: 'invalidToken' });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Аккаунт не найден');
        });
    });

    describe('PUT /furniture/card', () => {
        it('should update furniture card', async () => {
            checkUserAccess.mockResolvedValue(mockUserId);
            FURNITURE_CARD.findById.mockResolvedValue(mockFurniture);

            const res = await request(app)
                .put('/furniture/card')
                .query({
                    jwt: 'validToken',
                    furnitureCardId: mockFurnitureId
                })
                .send(mockFurniture);

            expect(FURNITURE_CARD.findById).toHaveBeenCalledWith(mockFurnitureId);
            expect(mockFurniture.save).toHaveBeenCalled();
            expect(res.statusCode).toBe(201);
            expect(res.body.message).toBe('Товар успешно обновлен');
        });

        it('should return 404 if account or furniture not found', async () => {
            checkUserAccess.mockResolvedValue(null);

            const res = await request(app)
                .put('/furniture/card')
                .query({ jwt: 'invalidToken' });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Аккаунт не найден');
        });
    });

    describe('DELETE /furniture/card', () => {
        it('should delete furniture card', async () => {
            checkUserAccess.mockResolvedValue(mockUserId);
            FURNITURE_CARD.findById.mockResolvedValue(mockFurniture);
            FURNITURE_CARD.deleteOne.mockResolvedValue({ deletedCount: 1 });

            const res = await request(app)
                .delete('/furniture/card')
                .query({
                    jwt: 'validToken',
                    furnitureCardId: mockFurnitureId
                });

            expect(FURNITURE_CARD.deleteOne).toHaveBeenCalledWith({ _id: mockFurnitureId });
            expect(res.statusCode).toBe(201);
            expect(res.body.message).toBe('Товар успешно удален');
        });

        it('should return 409 if no access', async () => {
            checkUserAccess.mockResolvedValue('differentUserId');
            FURNITURE_CARD.findById.mockResolvedValue(mockFurniture);

            const res = await request(app)
                .delete('/furniture/card')
                .query({
                    jwt: 'validToken',
                    furnitureCardId: mockFurnitureId
                });

            expect(res.statusCode).toBe(409);
            expect(res.body.message).toBe('Нет доступа');
        });
    });

    describe('GET /furniture/card', () => {
        it('should get furniture card with images', async () => {
            const mockImages = {
                images: ['image1', 'image2'],
                idMainImage: 0,
                color: '#fff'
            };

            FURNITURE_CARD.findById.mockResolvedValue(mockFurniture);
            IMAGES_FURNITURE.findOne.mockResolvedValue(mockImages);
            checkUserAccess.mockResolvedValue(mockUserId);

            const res = await request(app)
                .get('/furniture/card')
                .query({
                    jwt: 'validToken',
                    furnitureCardId: mockFurnitureId
                });

            expect(FURNITURE_CARD.findById).toHaveBeenCalledWith(mockFurnitureId);
            expect(res.statusCode).toBe(201);
            expect(res.body.furnitureCard).toBeDefined();
            expect(res.body.authorMatched).toBe(true);
        });

        it('should return 404 if furniture not found', async () => {
            FURNITURE_CARD.findById.mockResolvedValue(null);

            const res = await request(app)
                .get('/furniture/card')
                .query({ furnitureCardId: 'invalidId' });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Товар не найден');
        });
    });
});
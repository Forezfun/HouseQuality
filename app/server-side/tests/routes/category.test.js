const request = require('supertest');
const express = require('express');

jest.mock('../../src/models/category');

const CATEGORY = require('../../src/models/category');
const categoryRoutes = require('../../src/routes/categoryRoutes');

const app = express();
app.use(express.json());
app.use('/category', categoryRoutes);

describe('Category Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GET /category - should successfully return an array of categories', async () => {
        const mockCategories = [
            {
                name: "Телевизоры",
                translateOne: "телевизор",
                translateMany: "телевизоры",
                filters: [
                    {
                        name: "Диагональ экрана",
                        field: "screenSize",
                        type: "range",
                        min: 32,
                        max: 75
                    }
                ]
            },
            {
                name: "Холодильники",
                translateOne: "холодильник",
                translateMany: "холодильники",
                filters: []
            }
        ];

        CATEGORY.find.mockResolvedValue(mockCategories);

        const res = await request(app).get('/category');

        expect(CATEGORY.find).toHaveBeenCalled();
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({ categoryArray: mockCategories });
    });

    it('GET /category - should return 400 on database error', async () => {
        const errorMessage = 'Database error';
        CATEGORY.find.mockRejectedValue(new Error(errorMessage));

        const res = await request(app).get('/category');

        expect(CATEGORY.find).toHaveBeenCalled();
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe(errorMessage);
    });

    it('GET /category - should return an empty array if no categories found', async () => {
        CATEGORY.find.mockResolvedValue([]);

        const res = await request(app).get('/category');

        expect(CATEGORY.find).toHaveBeenCalled();
        expect(res.statusCode).toBe(201);
        expect(res.body.categoryArray).toEqual([]);
    });
});

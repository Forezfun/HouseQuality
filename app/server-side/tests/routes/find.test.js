const request = require('supertest');
const express = require('express');

jest.mock('../../src/models/furnitureCard');
jest.mock('../../src/helpers/findPublicationsHelpers');

const FURNITURE_CARD = require('../../src/models/furnitureCard');
const { searchPublications, transliterateQuery } = require('../../src/helpers/findPublicationsHelpers');
const findRoutes = require('../../src/routes/findRoutes');

const app = express();
app.use(express.json());
app.use('/find', findRoutes);

describe('Find Routes', () => {
    let mockFindChain;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockFindChain = {
            limit: jest.fn().mockReturnThis(),
            exec: jest.fn()
        };
        
        FURNITURE_CARD.find.mockImplementation(() => mockFindChain);
    });

    const mockFurniture = [
        {
            _id: '6641e6b9ce33a302f92f7c11',
            name: 'Кресло',
            shops: [{ cost: 5999 }, { cost: 6999 }],
            colors: [{ color: '#abc' }, { color: '#def' }],
            additionalData: { category: 'chairs' }
        },
        {
            _id: '6641e6b9ce33a302f92f7c12',
            name: 'Диван',
            shops: [{ cost: 19999 }, { cost: 21999 }],
            colors: [{ color: '#fff' }],
            additionalData: { category: 'sofas' }
        }
    ];

    it('GET /find - should successfully return search results', async () => {
        const query = 'кресло';
        
        mockFindChain.exec.mockResolvedValue(mockFurniture);
        searchPublications.mockImplementation((publications, q) => 
            publications.filter(p => p.name.toLowerCase().includes(q))
        );

        const res = await request(app).get('/find').query({ q: query });

        expect(FURNITURE_CARD.find).toHaveBeenCalled();
        expect(mockFindChain.limit).toHaveBeenCalledWith(51);
        expect(searchPublications).toHaveBeenCalled();
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual([{
            name: 'Кресло',
            cost: 5999,
            colorRequest: '#abc',
            id: '6641e6b9ce33a302f92f7c11',
            category: 'chairs'
        }]);
    });

    it('GET /find - should return 400 if query string is empty', async () => {
        const res = await request(app).get('/find').query({ q: '' });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Строка запроса пустая');
    });

    it('GET /find - should add transliterated results if not enough matches found', async () => {
        const query = 'kreslo';
        
        mockFindChain.exec.mockResolvedValue(mockFurniture);
        searchPublications.mockImplementation((publications, q) => 
            q === 'kreslo' ? [] : [mockFurniture[0]]
        );
        transliterateQuery.mockReturnValue('кресло');

        const res = await request(app).get('/find').query({ q: query });

        expect(transliterateQuery).toHaveBeenCalledWith(query);
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('Кресло');
    });

    it('GET /find - should return 500 if server error occurs', async () => {
        const errorMessage = 'Database error';
        mockFindChain.exec.mockRejectedValue(new Error(errorMessage));
        console.error = jest.fn();

        const res = await request(app).get('/find').query({ q: 'диван' });

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe(errorMessage);
    });

    it('GET /find - should sort shops by price', async () => {
        const query = 'кресло';
        const furnitureWithUnsortedShops = {
            ...mockFurniture[0],
            shops: [{ cost: 6999 }, { cost: 5999 }] 
        };
        
        mockFindChain.exec.mockResolvedValue([furnitureWithUnsortedShops]);
        searchPublications.mockReturnValue([furnitureWithUnsortedShops]);

        const res = await request(app).get('/find').query({ q: query });

        expect(res.body[0].cost).toBe(5999); 
    });
});

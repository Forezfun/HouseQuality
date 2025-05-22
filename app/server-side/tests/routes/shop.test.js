const request = require('supertest');
const express = require('express');
const router = require('../../src/routes/shopRoutes');
const FURNITURE_CARD = require('../../src/models/furnitureCard');
const IMAGES_FURNITURE = require('../../src/models/imagesFurniture');
const { searchPublications, transliterateQuery } = require('../../src/helpers/findPublicationsHelpers');

jest.mock('../../src/models/furnitureCard');
jest.mock('../../src/models/imagesFurniture');
jest.mock('../../src/helpers/findPublicationsHelpers');

const app = express();
app.use(express.json());
app.use('/', router);

describe('Shop Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return filtered furniture cards', async () => {
    const mockFurniture = [{
      _id: '1',
      name: 'Кресло',
      colors: [{ color: '#abc' }, { color: '#def' }],
      shops: [{ cost: 5999 }, { cost: 6999 }],
      proportions: { width: 100, length: 90, height: 120 },
    }];

    const mockImage = {
      color: '#abc',
      idMainImage: 0,
    };

    FURNITURE_CARD.find.mockImplementation(() => ({
      skip: () => ({
        limit: () => Promise.resolve(mockFurniture),
      }),
    }));

    FURNITURE_CARD.countDocuments.mockResolvedValue(1);
    IMAGES_FURNITURE.findOne.mockResolvedValue(mockImage);
    searchPublications.mockReturnValue(mockFurniture);
    transliterateQuery.mockReturnValue('Kreslo');

    const response = await request(app)
      .get('/')
      .query({
        startRange: 0,
        category: 'chairs',
        filters: JSON.stringify({
          name: 'Кресло',
        }),
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.resultsArray).toHaveLength(1);
    expect(response.body.resultsArray[0]).toMatchObject({
      name: 'Кресло',
      cost: 5999,
      furnitureCardId: '1',
      previewUrl: expect.stringContaining('furniture/images/simple'),
      colors: ['#abc', '#def'],
      proportions: { width: 100, length: 90, height: 120 },
    });
  });

  it('should return 400 if startRange is not a number', async () => {
    const response = await request(app).get('/').query({ startRange: 'abc' });
    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ message: 'Диапазон должен быть числом' });
  });

  it('should handle empty results gracefully', async () => {
    FURNITURE_CARD.find.mockImplementation(() => ({
      skip: () => ({
        limit: () => Promise.resolve([]),
      }),
    }));

    FURNITURE_CARD.countDocuments.mockResolvedValue(0);

    const response = await request(app)
      .get('/')
      .query({ startRange: 0, category: 'all' });

    expect(response.statusCode).toBe(200);
    expect(response.body.resultsArray).toEqual([]);
  });
});

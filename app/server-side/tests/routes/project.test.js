const request = require('supertest');
const express = require('express');
const { ObjectId } = require('mongodb');

jest.mock('../../src/models/project');
jest.mock('../../src/models/furnitureCard');
jest.mock('../../src/helpers/jwtHandlers');

const PROJECT = require('../../src/models/project');
const FURNITURE_CARD = require('../../src/models/furnitureCard');
const { checkUserAccess } = require('../../src/helpers/jwtHandlers');

const projectRoutes = require('../../src/routes/projectRoutes');

const app = express();
app.use(express.json());
app.use('/project', projectRoutes);

describe('Project Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUserId = '6641e6b9ce33a302f92f7c11';
  const mockProjectId = '664a328ab1a2b5d52a458f2f';
  const mockRoomId = new ObjectId().toString();

  const mockProject = {
    _id: mockProjectId,
    name: 'Проект кухни',
    rooms: [],
    authorId: mockUserId,
    save: jest.fn().mockResolvedValue({ message: 'Проект успешно сохранен' }),
  };

  describe('POST /project', () => {
    it('should create a new project', async () => {
      checkUserAccess.mockResolvedValue(mockUserId);
      PROJECT.mockImplementation(() => mockProject);

      const res = await request(app)
        .post('/project')
        .send({ jwt: 'validToken', name: 'Проект кухни' });

      expect(checkUserAccess).toHaveBeenCalledWith('validToken');
      expect(res.statusCode).toBe(201);
      expect(res.body.projectData).toMatchObject({
        name: 'Проект кухни',
        authorId: mockUserId,
      });
    });

    it('should return 404 if account not found', async () => {
      checkUserAccess.mockResolvedValue(null);

      const res = await request(app)
        .post('/project')
        .send({ jwt: 'invalidToken', name: 'Проект кухни' });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Аккаунт не найден');
    });
  });

  describe('GET /project', () => {
    it('should return project by ID', async () => {
      checkUserAccess.mockResolvedValue(mockUserId);
      PROJECT.findById.mockResolvedValue(mockProject);

      const res = await request(app)
        .get('/project')
        .query({ jwt: 'validToken', projectId: mockProjectId });

      expect(checkUserAccess).toHaveBeenCalledWith('validToken');
      expect(PROJECT.findById).toHaveBeenCalledWith(mockProjectId);
      expect(res.statusCode).toBe(201);
      expect(res.body.projectData).toMatchObject({ name: 'Проект кухни' });
    });

    it('should return 404 if project not found', async () => {
      checkUserAccess.mockResolvedValue(mockUserId);
      PROJECT.findById.mockResolvedValue(null);

      const res = await request(app)
        .get('/project')
        .query({ jwt: 'validToken', projectId: 'invalidId' });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Аккаунт не найден');
    });

    it('should return 404 if account not found', async () => {
      checkUserAccess.mockResolvedValue(null);

      const res = await request(app)
        .get('/project')
        .query({ jwt: 'invalidToken', projectId: mockProjectId });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Аккаунт не найден');
    });
  });

  describe('PUT /project', () => {
    it('should update the project', async () => {
      checkUserAccess.mockResolvedValue(mockUserId);
      PROJECT.findById.mockResolvedValue(mockProject);

      const updatedData = {
        name: 'Updated Project',
        rooms: [{ name: 'Room 1', objects: [] }],
      };

      const res = await request(app)
        .put('/project')
        .query({ jwt: 'validToken', projectId: mockProjectId })
        .send(updatedData);

      expect(checkUserAccess).toHaveBeenCalledWith('validToken');
      expect(PROJECT.findById).toHaveBeenCalledWith(mockProjectId);
      expect(mockProject.save).toHaveBeenCalled();
      expect(mockProject.name).toBe(updatedData.name);
      expect(mockProject.rooms).toStrictEqual(updatedData.rooms);
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Проект обновлен');
    });

    it('should return 404 if account not found', async () => {
      checkUserAccess.mockResolvedValue(null);

      const res = await request(app)
        .put('/project')
        .query({ jwt: 'invalidToken', projectId: mockProjectId })
        .send({ name: 'Something' });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Аккаунт не найден');
    });

    it('should return 404 if project not found', async () => {
      checkUserAccess.mockResolvedValue(mockUserId);
      PROJECT.findById.mockResolvedValue(null);

      const res = await request(app)
        .put('/project')
        .query({ jwt: 'validToken', projectId: 'invalidId' })
        .send({ name: 'Something' });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Проект не найден');
    });
  });

  describe('DELETE /project', () => {
    it('should delete the project', async () => {
      checkUserAccess.mockResolvedValue(mockUserId);
      PROJECT.findByIdAndDelete.mockResolvedValue(mockProject);

      const res = await request(app)
        .delete('/project')
        .query({ jwt: 'validToken', projectId: mockProjectId });

      expect(checkUserAccess).toHaveBeenCalledWith('validToken');
      expect(PROJECT.findByIdAndDelete).toHaveBeenCalledWith(mockProjectId);
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Проект удален');
    });

    it('should return 404 if account not found', async () => {
      checkUserAccess.mockResolvedValue(null);

      const res = await request(app)
        .delete('/project')
        .query({ jwt: 'invalidToken', projectId: mockProjectId });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Аккаунт не найден');
    });

    it('should return 404 if project not found', async () => {
      checkUserAccess.mockResolvedValue(mockUserId);
      PROJECT.findByIdAndDelete.mockResolvedValue(null);

      const res = await request(app)
        .delete('/project')
        .query({ jwt: 'validToken', projectId: 'invalidId' });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Проект не найден');
    });
  });

  describe('GET /project/room', () => {
    it('should return room data with furnitures', async () => {
      checkUserAccess.mockResolvedValue(mockUserId);

      const roomObjectId = new ObjectId(mockRoomId);

      PROJECT.aggregate = jest.fn().mockResolvedValue([{    
        room: [{
          _id: roomObjectId,
          name: 'Гостиная',
          roomProportions: { width: 10, length: 15, height: 3 },
          objects: [
            {
              objectId: '6634f1129f6f7cba29cd12f9',
              position: { x: 1, y: 1, z: 1 },
              rotation: { x: 0, y: 180, z: 0 }
            }
          ]
        }]
      }]);

      FURNITURE_CARD.findById = jest.fn().mockResolvedValue({
        _id: '6634f1129f6f7cba29cd12f9',
        name: 'Диван',
        proportions: { width: 200, length: 300, height: 90 },
        additionalData: { category: 'sofa' },
        shops: [100, 200, 300, 400, 500, 600],
        colors: [{ color: '#fff' }]
      });

      const res = await request(app)
        .get('/project/room')
        .query({ jwt: 'validToken', roomId: mockRoomId });

      expect(checkUserAccess).toHaveBeenCalledWith('validToken');
      expect(PROJECT.aggregate).toHaveBeenCalled();
      expect(FURNITURE_CARD.findById).toHaveBeenCalledWith('6634f1129f6f7cba29cd12f9');
      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('Гостиная');
      expect(res.body.furnitures).toBeDefined();
      expect(Array.isArray(res.body.furnitures)).toBe(true);
    });

    it('should return 404 if account not found', async () => {
      checkUserAccess.mockResolvedValue(null);

      const res = await request(app)
        .get('/project/room')
        .query({ jwt: 'invalidToken', roomId: mockRoomId });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Аккаунт не найден');
    });

    it('should return 404 if room not found', async () => {
      checkUserAccess.mockResolvedValue(mockUserId);
      PROJECT.aggregate = jest.fn().mockResolvedValue([]);

      const res = await request(app)
        .get('/project/room')
        .query({ jwt: 'validToken', roomId: mockRoomId });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Комната не найдена');
    });
  });
});

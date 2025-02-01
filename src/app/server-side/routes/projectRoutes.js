const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const PROJECT = require('../models/project.js');
const { checkUserAccess } = require('../helpers/jwtHandlers');
const { ObjectId } = require('mongodb');
const dbModule = require('../server');
ROUTER.delete('/', async (request, result) => {
  try {
    const db = await dbModule.getDb();
    const JWT_TOKEN = request.query.jwtToken;
    const USER_ID = await checkUserAccess(JWT_TOKEN);
    console.log()
    if (!USER_ID) return result.status(404).json({ message: 'User not found' });
    const project = await db.collection('projects').findOne({ _id: new ObjectId(request.query.projectId) });

    if (project) {
      await db.collection('projects').deleteOne({ _id: new ObjectId(request.query.projectId) });
    }else{
      return result.status(404).json({ message: 'Project not found' });
    }
    result.status(201).json({ message: 'Project deleted' });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
});

ROUTER.post('/', async (request, result) => {
  try {
    const db = await dbModule.getDb();
    const JWT_TOKEN = request.body.jwtToken;
    const USER_ID = await checkUserAccess(JWT_TOKEN);

    if (!USER_ID) return result.status(404).json({ message: 'User not found' });

    const NEW_PROJECT_ITEM = {
      name: request.body.nameProject,
      rooms: [],
      authorId: USER_ID
    };

    await db.collection('projects').insertOne(NEW_PROJECT_ITEM);

    result.status(201).json({ message: 'Project created successfully' });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
});

ROUTER.get('/', async (request, result) => {
  try {
    const db = await dbModule.getDb();
    const JWT_TOKEN = request.query.jwtToken;
    const USER_ID = await checkUserAccess(JWT_TOKEN);

    if (!USER_ID) return result.status(404).json({ message: 'User not found' });

    const PROJECT_ITEM = await db.collection('projects').findOne({ _id: new ObjectId(request.query.projectId) });

    if (!PROJECT_ITEM) return result.status(404).json({ message: 'Project not found' });

    result.status(201).json({ projectData: PROJECT_ITEM });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
});

ROUTER.put('/', async (request, result) => {
  try {
    const db = await dbModule.getDb();
    const JWT_TOKEN = request.body.jwtToken;
    const USER_ID = await checkUserAccess(JWT_TOKEN);

    if (!USER_ID) return result.status(404).json({ message: 'User not found' });

    const updateResult = await db.collection('projects').findOneAndUpdate(
      { authorId: new ObjectId(USER_ID) },
      { $set: { name: request.body.nameProject, rooms: JSON.parse(request.body.rooms) } },
      { returnDocument: true }
    );

    if (!updateResult) return result.status(404).json({ message: 'Project not found' });

    result.status(201).json({ message: 'Project successfully updated' });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
});

module.exports = ROUTER;

